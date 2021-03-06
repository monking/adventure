/**
 * marked - a markdown parser
 * Copyright (c) 2011-2013, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

;(function() {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  nptable: noop,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  blockquote: /^( *>[^\n]+(\n[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment|closed|closing) *(?:\n{2,}|\s*$)/,
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  table: noop,
  paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
  text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
  (/bull/g, block.bullet)
  ();

block.list = replace(block.list)
  (/bull/g, block.bullet)
  ('hr', /\n+(?=(?: *[-*_]){3,} *(?:\n+|$))/)
  ();

block._tag = '(?!(?:'
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
  + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|@)\\b';

block.html = replace(block.html)
  ('comment', /<!--[\s\S]*?-->/)
  ('closed', /<(tag)[\s\S]+?<\/\1>/)
  ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
  (/tag/g, block._tag)
  ();

block.paragraph = replace(block.paragraph)
  ('hr', block.hr)
  ('heading', block.heading)
  ('lheading', block.lheading)
  ('blockquote', block.blockquote)
  ('tag', '<' + block._tag)
  ('def', block.def)
  ();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,
  paragraph: /^/
});

block.gfm.paragraph = replace(block.paragraph)
  ('(?!', '(?!'
    + block.gfm.fences.source.replace('\\1', '\\2') + '|'
    + block.list.source.replace('\\1', '\\3') + '|')
  ();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = {};
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.gfm) {
    if (this.options.tables) {
      this.rules = block.tables;
    } else {
      this.rules = block.gfm;
    }
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.token = function(src, top) {
  var src = src.replace(/^ +$/gm, '')
    , next
    , loose
    , cap
    , bull
    , b
    , item
    , space
    , i
    , l;

  while (src) {
    // newline
    if (cap = this.rules.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? cap.replace(/\n+$/, '')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (cap = this.rules.fences.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: cap[2],
        text: cap[3]
      });
      continue;
    }

    // heading
    if (cap = this.rules.heading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (top && (cap = this.rules.nptable.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i].split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // lheading
    if (cap = this.rules.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // hr
    if (cap = this.rules.hr.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = this.rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = this.rules.list.exec(src)) {
      src = src.substring(cap[0].length);
      bull = cap[2];

      this.tokens.push({
        type: 'list_start',
        ordered: bull.length > 1
      });

      // Get each top-level item.
      cap = cap[0].match(this.rules.item);

      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) +/, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (this.options.smartLists && i !== l - 1) {
          b = block.bullet.exec(cap[i + 1])[0];
          if (bull !== b && !(bull.length > 1 && b.length > 1)) {
            src = cap.slice(i + 1).join('\n') + src;
            i = l - 1;
          }
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item.charAt(item.length - 1) === '\n';
          if (!loose) loose = next;
        }

        this.tokens.push({
          type: loose
            ? 'loose_item_start'
            : 'list_item_start'
        });

        // Recurse.
        this.token(item, false);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = this.rules.html.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style',
        text: cap[0]
      });
      continue;
    }

    // def
    if (top && (cap = this.rules.def.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.links[cap[1].toLowerCase()] = {
        href: cap[2],
        title: cap[3]
      };
      continue;
    }

    // table (gfm)
    if (top && (cap = this.rules.table.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i]
          .replace(/^ *\| *| *\| *$/g, '')
          .split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // top-level paragraph
    if (top && (cap = this.rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: cap[1].charAt(cap[1].length - 1) === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      });
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
  url: noop,
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
  link: /^!?\[(inside)\]\(href\)/,
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
  em: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
  code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
  br: /^ {2,}\n(?!\s*$)/,
  del: noop,
  text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
};

inline._inside = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
inline._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
  ('inside', inline._inside)
  ('href', inline._href)
  ();

inline.reflink = replace(inline.reflink)
  ('inside', inline._inside)
  ();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: replace(inline.escape)('])', '~|])')(),
  url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
  del: /^~~(?=\S)([\s\S]*?\S)~~/,
  text: replace(inline.text)
    (']|', '~]|')
    ('|', '|https?://|')
    ()
});

/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: replace(inline.br)('{2,}', '*')(),
  text: replace(inline.gfm.text)('{2,}', '*')()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;

  if (!this.links) {
    throw new
      Error('Tokens array requires a `links` property.');
  }

  if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  } else if (this.options.pedantic) {
    this.rules = inline.pedantic;
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
  var out = ''
    , link
    , text
    , href
    , cap;

  while (src) {
    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = cap[1].charAt(6) === ':'
          ? this.mangle(cap[1].substring(7))
          : this.mangle(cap[1]);
        href = this.mangle('mailto:') + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += '<a href="'
        + href
        + '">'
        + text
        + '</a>';
      continue;
    }

    // url (gfm)
    if (cap = this.rules.url.exec(src)) {
      src = src.substring(cap[0].length);
      text = escape(cap[1]);
      href = text;
      out += '<a href="'
        + href
        + '">'
        + text
        + '</a>';
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? escape(cap[0])
        : cap[0];
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.outputLink(cap, {
        href: cap[2],
        title: cap[3]
      });
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0].charAt(0);
        src = cap[0].substring(1) + src;
        continue;
      }
      out += this.outputLink(cap, link);
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<strong>'
        + this.output(cap[2] || cap[1])
        + '</strong>';
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<em>'
        + this.output(cap[2] || cap[1])
        + '</em>';
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<code>'
        + escape(cap[2], true)
        + '</code>';
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<br>';
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += '<del>'
        + this.output(cap[1])
        + '</del>';
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      out += escape(this.smartypants(cap[0]));
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  if (cap[0].charAt(0) !== '!') {
    return '<a href="'
      + escape(link.href)
      + '"'
      + (link.title
      ? ' title="'
      + escape(link.title)
      + '"'
      : '')
      + '>'
      + this.output(cap[1])
      + '</a>';
  } else {
    return '<img src="'
      + escape(link.href)
      + '" alt="'
      + escape(cap[1])
      + '"'
      + (link.title
      ? ' title="'
      + escape(link.title)
      + '"'
      : '')
      + '>';
  }
};

/**
 * Smartypants Transformations
 */

InlineLexer.prototype.smartypants = function(text) {
  if (!this.options.smartypants) return text;
  return text
    // em-dashes
    .replace(/--/g, '\u2014')
    // opening singles
    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
    // closing singles & apostrophes
    .replace(/'/g, '\u2019')
    // opening doubles
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
    // closing doubles
    .replace(/"/g, '\u201d')
    // ellipses
    .replace(/\.{3}/g, '\u2026');
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
  var out = ''
    , l = text.length
    , i = 0
    , ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options) {
  var parser = new Parser(options);
  return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length - 1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return '<hr>\n';
    }
    case 'heading': {
      return '<h'
        + this.token.depth
        + ' id="'
        + this.token.text.toLowerCase().replace(/[^\w]+/g, '-')
        + '">'
        + this.inline.output(this.token.text)
        + '</h'
        + this.token.depth
        + '>\n';
    }
    case 'code': {
      if (this.options.highlight) {
        var code = this.options.highlight(this.token.text, this.token.lang);
        if (code != null && code !== this.token.text) {
          this.token.escaped = true;
          this.token.text = code;
        }
      }

      if (!this.token.escaped) {
        this.token.text = escape(this.token.text, true);
      }

      return '<pre><code'
        + (this.token.lang
        ? ' class="'
        + this.options.langPrefix
        + this.token.lang
        + '"'
        : '')
        + '>'
        + this.token.text
        + '</code></pre>\n';
    }
    case 'table': {
      var body = ''
        , heading
        , i
        , row
        , cell
        , j;

      // header
      body += '<thead>\n<tr>\n';
      for (i = 0; i < this.token.header.length; i++) {
        heading = this.inline.output(this.token.header[i]);
        body += '<th';
        if (this.token.align[i]) {
          body += ' style="text-align:' + this.token.align[i] + '"';
        }
        body += '>' + heading + '</th>\n';
      }
      body += '</tr>\n</thead>\n';

      // body
      body += '<tbody>\n'
      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];
        body += '<tr>\n';
        for (j = 0; j < row.length; j++) {
          cell = this.inline.output(row[j]);
          body += '<td';
          if (this.token.align[j]) {
            body += ' style="text-align:' + this.token.align[j] + '"';
          }
          body += '>' + cell + '</td>\n';
        }
        body += '</tr>\n';
      }
      body += '</tbody>\n';

      return '<table>\n'
        + body
        + '</table>\n';
    }
    case 'blockquote_start': {
      var body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return '<blockquote>\n'
        + body
        + '</blockquote>\n';
    }
    case 'list_start': {
      var type = this.token.ordered ? 'ol' : 'ul'
        , body = '';

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return '<'
        + type
        + '>\n'
        + body
        + '</'
        + type
        + '>\n';
    }
    case 'list_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }

      return '<li>'
        + body
        + '</li>\n';
    }
    case 'loose_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.tok();
      }

      return '<li>'
        + body
        + '</li>\n';
    }
    case 'html': {
      return !this.token.pre && !this.options.pedantic
        ? this.inline.output(this.token.text)
        : this.token.text;
    }
    case 'paragraph': {
      return '<p>'
        + this.inline.output(this.token.text)
        + '</p>\n';
    }
    case 'text': {
      return '<p>'
        + this.parseText()
        + '</p>\n';
    }
  }
};

/**
 * Helpers
 */

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function replace(regex, opt) {
  regex = regex.source;
  opt = opt || '';
  return function self(name, val) {
    if (!name) return new RegExp(regex, opt);
    val = val.source || val;
    val = val.replace(/(^|[^\[])\^/g, '$1');
    regex = regex.replace(name, val);
    return self;
  };
}

function noop() {}
noop.exec = noop;

function merge(obj) {
  var i = 1
    , target
    , key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}

/**
 * Marked
 */

function marked(src, opt, callback) {
  if (callback || typeof opt === 'function') {
    if (!callback) {
      callback = opt;
      opt = null;
    }

    opt = merge({}, marked.defaults, opt || {});

    var highlight = opt.highlight
      , tokens
      , pending
      , i = 0;

    try {
      tokens = Lexer.lex(src, opt)
    } catch (e) {
      return callback(e);
    }

    pending = tokens.length;

    var done = function() {
      var out, err;

      try {
        out = Parser.parse(tokens, opt);
      } catch (e) {
        err = e;
      }

      opt.highlight = highlight;

      return err
        ? callback(err)
        : callback(null, out);
    };

    if (!highlight || highlight.length < 3) {
      return done();
    }

    delete opt.highlight;

    if (!pending) return done();

    for (; i < tokens.length; i++) {
      (function(token) {
        if (token.type !== 'code') {
          return --pending || done();
        }
        return highlight(token.text, token.lang, function(err, code) {
          if (code == null || code === token.text) {
            return --pending || done();
          }
          token.text = code;
          token.escaped = true;
          --pending || done();
        });
      })(tokens[i]);
    }

    return;
  }
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/chjj/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occured:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.defaults = {
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: false,
  silent: false,
  highlight: null,
  langPrefix: 'lang-',
  smartypants: false
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.parse = marked;

if (typeof exports === 'object') {
  module.exports = marked;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return marked; });
} else {
  this.marked = marked;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());

(function() {
  var Adventure, AdventureInterface, BrowserInterface, Character, Item, NodeInterface, Scene, Scenery, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Adventure = (function() {
    function Adventure(options) {
      var action, name, self, _ref;
      self = this;
      this.scenes = options.scenes || {};
      this.cast = options.cast || {};
      this.items = options.items || {};
      if (options.actions != null) {
        _ref = options.actions;
        for (name in _ref) {
          action = _ref[name];
          this.actions[name] = action;
        }
      }
      this.story = options.story;
      if (options["interface"] != null) {
        this["interface"] = new options["interface"]();
      } else {
        this["interface"] = new (typeof module !== "undefined" && module !== null ? NodeInterface : BrowserInterface)();
      }
      this["interface"].attach(function() {
        self.start();
        return self.prompt();
      });
    }

    Adventure.prototype.start = function() {
      var name, scene, _ref;
      _ref = this.scenes;
      for (name in _ref) {
        scene = _ref[name];
        scene.been = false;
      }
      this.inventory = [];
      this.history = {
        at: null,
        back: null
      };
      this.scene = null;
      this.state = "breathing";
      return this.story();
    };

    Adventure.prototype.narrate = function(statement) {
      return this["interface"].print(statement);
    };

    Adventure.prototype.prompt = function(statement, callback) {
      var self;
      self = this;
      if (statement != null) {
        this.narrate("" + statement + "\n");
      }
      return this["interface"].read(function(input) {
        if (callback != null) {
          return callback(input);
        } else {
          self.parse(input);
          return self.prompt();
        }
      });
    };

    Adventure.prototype.parse = function(statement) {
      var act, actionFound, match, name, self, _ref;
      self = this;
      actionFound = false;
      if (this.state === "dead" && !/restart/i.test(statement)) {
        this.prompt("You're still dead. Continue from the beginning? (Say \"yes\")", function(answer) {
          if (/yes/i.test(answer)) {
            return self.start();
          } else {
            return self.parse(answer);
          }
        });
        actionFound = true;
      } else {
        _ref = this.actions;
        for (name in _ref) {
          act = _ref[name];
          if (match = statement.match(act.pattern)) {
            act.deed.apply(this, [match]);
            actionFound = true;
            break;
          }
        }
      }
      return actionFound;
    };

    Adventure.prototype.get = function(item) {
      var count, holding, _i, _len, _ref;
      this.inventory.push(item);
      count = 0;
      _ref = this.inventory;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        holding = _ref[_i];
        if (holding.name === item.name) {
          count++;
        }
      }
      return "You now have " + count + " " + item.name;
    };

    Adventure.prototype.actOn = function(objectName, verb, itemName, article) {
      var context, count, item, object, output, result, _ref, _ref1;
      if (!objectName || objectName === "scene") {
        context = null;
        object = this.scene;
      } else {
        context = this.scene;
        object = (_ref = (context.objects != null) && context.objects[objectName]) != null ? _ref : null;
      }
      if (object) {
        count = 1;
        if (item = (_ref1 = itemName && this.scene.objects[itemName]) != null ? _ref1 : null) {
          if (article === "all") {
            count = item.count;
          } else if (!isNaN(article && article !== "")) {
            count = Number(article);
          }
        }
        if (item && count > item.count) {
          output = "You don't have " + article + " " + itemName;
        } else {
          result = object.receiveAction({
            verb: verb,
            item: item,
            count: count
          });
          if (result.item != null) {
            this.get(result.item);
          }
          if (result.go != null) {
            this.go(result.go);
          }
          output = result.message || "";
          if ((context != null) && object.count === 0) {
            delete context.objects[objectName];
          }
        }
      } else {
        output = "There is no " + objectName + " here.";
      }
      return output;
    };

    Adventure.prototype.go = function(sceneName) {
      var exits, name, pattern, sceneMatchCount, _i, _len, _ref;
      if (sceneName === "back") {
        sceneName = this.history.back;
      }
      pattern = new RegExp(sceneName, "i");
      if (this.scene == null) {
        sceneMatchCount = 1;
      } else {
        exits = (_ref = this.scene.exits.slice()) != null ? _ref : [];
        if (this.scene.softExits != null) {
          exits = exits.concat(this.scene.softExits);
        }
        sceneMatchCount = 0;
        for (_i = 0, _len = exits.length; _i < _len; _i++) {
          name = exits[_i];
          if (pattern.test(name)) {
            sceneName = name;
            sceneMatchCount++;
          }
        }
      }
      if (sceneMatchCount === 0) {
        return this.narrate("You can't go there from here.");
      } else if (sceneMatchCount === 1) {
        this.history.back = this.history.at;
        this.history.at = sceneName;
        this.scene = this.scenes[sceneName];
        if (this.scene.event != null) {
          this.scene.event.call(this);
        } else {
          this.narrate(this.actOn("scene", "look"));
        }
        return this.scene.been = true;
      } else {
        return this.narrate("Can you be more specific?");
      }
    };

    Adventure.prototype.actions = {
      help: {
        pattern: /help/i,
        deed: function(match) {
          this.narrate("Commands are 'go', 'pick up', 'use', 'look', and 'help'");
          return this.narrate(this.actOn("scene", "look"));
        }
      },
      open: {
        pattern: /open (.*)/i,
        deed: function(match) {
          if (/inv(entory)?/i.test(match[1])) {
            return this.actions.inventory.deed.call(this);
          } else {
            if (match[1] != null) {
              return this.narrate(this.actOn(match[1], "open"));
            } else {
              return this.narrate("Open...what?");
            }
          }
        }
      },
      look: {
        pattern: /where( am i| are we)?|(look( at)?|check out|what is|what's)( the| a)?( (.*))?/i,
        deed: function(match) {
          var objectName;
          if (/me|self|health/i.test(match[6])) {
            return this.actions.state.deed.call(this);
          } else {
            if ((match[6] == null) || /around|about/i.test(match[6])) {
              objectName = "scene";
            } else {
              objectName = match[6];
            }
            return this.narrate(this.actOn(objectName, "look"));
          }
        }
      },
      pickUp: {
        pattern: /(pick up|take|get)( ([0-9]+|the|a|some|an|all))? (.*)/i,
        deed: function(match) {
          var article, itemName;
          article = match[3] || "the";
          itemName = match[4];
          return this.actOn(itemName, "take", null, article);
        }
      },
      state: {
        pattern: /how am|state|health/i,
        deed: function(match) {
          return this.narrate("Well, you're " + this.state + ".");
        }
      },
      inventory: {
        pattern: /inv(entory)?/i,
        deed: function(match) {
          var item, items, _i, _len, _ref;
          items = [];
          _ref = this.inventory;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            item = _ref[_i];
            items.push("  - " + item.count + " " + item.name);
          }
          return this.narrate(items.join("\n"));
        }
      },
      go: {
        pattern: /go( (to( the)?))? (.*)\.?/i,
        deed: function(match) {
          return this.go(match[4]);
        }
      },
      use: {
        pattern: /use( ([0-9]+|the|a|some|an|all))? (.+?)( (with|on)( the)? (.*))?/i,
        deed: function(match) {
          var article, itemName, objectName;
          itemName = match[3];
          article = match[2];
          objectName = match[7];
          return this.narrate(this.actOn(objectName, "use", itemName, article));
        }
      },
      restart: {
        pattern: /restart/i,
        deed: function() {
          return this.start();
        }
      },
      say: {
        pattern: /say (.*)/i,
        deed: function(match) {
          return this.narrate("\"" + match[1] + "\"");
        }
      }
    };

    return Adventure;

  })();

  Scenery = (function() {
    function Scenery(options) {
      var action, name, _ref;
      this.options = options;
      this.actions = {
        look: function() {
          return {
            message: this.description()
          };
        }
      };
      if ((options != null) && (options.name != null)) {
        this.name = options.name;
      }
      if ((options != null) && (options.description != null)) {
        this.description = options.description;
      }
      if ((options != null) && (options.actions != null)) {
        _ref = options.actions;
        for (name in _ref) {
          action = _ref[name];
          this.actions[name] = action;
        }
      }
    }

    Scenery.prototype.clone = function() {
      var newInstance;
      return newInstance = new this.constructor(this.options);
    };

    Scenery.prototype.receiveAction = function(params) {
      if (this.actions[params.verb] != null) {
        return this.actions[params.verb].apply(this, [params]);
      } else {
        return {
          message: "I'm not sure what you mean."
        };
      }
    };

    return Scenery;

  })();

  Scene = (function(_super) {
    __extends(Scene, _super);

    function Scene(options) {
      var _ref;
      Scene.__super__.constructor.call(this, options);
      this.intro = options.intro, this.exits = options.exits, this.softExits = options.softExits, this.event = options.event, this.objects = options.objects;
      this.options = options;
      this.been = false;
      this.actions.look = (_ref = options.look) != null ? _ref : function() {
        var output;
        if ((this.intro != null) && !this.been) {
          output = "\n" + (this.intro());
        } else {
          output = "\n" + (this.description());
        }
        if (this.exits != null) {
          output += "\n\nExits are **" + (this.exits.join("**, **")) + "**.";
        }
        return {
          message: output
        };
      };
    }

    return Scene;

  })(Scenery);

  Item = (function(_super) {
    __extends(Item, _super);

    function Item(options) {
      var _ref, _ref1;
      Item.__super__.constructor.call(this, options);
      this.count = (_ref = (options != null) && options.count) != null ? _ref : 1;
      this.actions.take = (_ref1 = (options != null) && options.take) != null ? _ref1 : function(params) {
        var item;
        item = this.take(params.count);
        return {
          item: item,
          dest: "inventory",
          message: item != null ? "You take the " + this.name + "." : "You can't take " + params.count + " " + this.name
        };
      };
    }

    Item.prototype.take = function(quantity) {
      var newInstance;
      if (quantity == null) {
        quantity = 1;
      }
      quantity = Math.min(quantity, this.count);
      newInstance = this.clone();
      newInstance.count = quantity;
      this.count -= quantity;
      return newInstance;
    };

    Item.prototype.description = function() {
      return "It's a thing, for sure.";
    };

    return Item;

  })(Scenery);

  Character = (function(_super) {
    __extends(Character, _super);

    function Character(options) {
      this.name = options.name;
    }

    Character.prototype.description = function() {
      return "Who or what could it be?";
    };

    return Character;

  })(Scenery);

  this.Adventure = Adventure;

  this.Scenery = Scenery;

  this.Scene = Scene;

  this.Item = Item;

  this.Character = Character;

  AdventureInterface = (function() {
    function AdventureInterface() {}

    AdventureInterface.prototype.attach = function(callback) {
      return callback();
    };

    AdventureInterface.prototype.print = function(markdown) {
      if (typeof console !== "undefined" && console !== null) {
        return console.log(markdown);
      }
    };

    AdventureInterface.prototype.read = function(callback) {
      if (typeof window !== "undefined" && window !== null) {
        return callback(window.prompt());
      }
    };

    return AdventureInterface;

  })();

  this.AdventureInterface = AdventureInterface;

  NodeInterface = (function() {
    function NodeInterface() {}

    NodeInterface.prototype.attach = function(callback) {
      return callback();
    };

    NodeInterface.prototype.print = function(string) {
      return process.stdout.write("" + string + "\n");
    };

    NodeInterface.prototype.read = function(callback) {
      process.stdout.write("> ");
      process.stdin.resume();
      return process.stdin.once("data", function(data) {
        return callback(data.toString().trim());
      });
    };

    return NodeInterface;

  })();

  this.NodeInterface = NodeInterface;

  BrowserInterface = (function(_super) {
    __extends(BrowserInterface, _super);

    function BrowserInterface() {
      _ref = BrowserInterface.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    BrowserInterface.prototype.attach = function(callback) {
      var oldOnload;
      oldOnload = window.onload;
      return window.onload = function() {
        if (oldOnload != null) {
          oldOnload();
        }
        return callback();
      };
    };

    BrowserInterface.prototype.print = function(markdown) {
      var li, log;
      log = document.getElementById("log");
      li = document.createElement("li");
      li.className = "new";
      li.innerHTML = marked(markdown);
      return log.appendChild(li);
    };

    BrowserInterface.prototype.read = function(callback) {
      var field, log;
      log = document.getElementById("log");
      field = document.createElement("li");
      field.className = "new";
      field.setAttribute("contenteditable", "true");
      log.appendChild(field);
      field.onkeydown = function(event) {
        var li, newLI;
        if (event.keyCode === 13) {
          event.preventDefault();
          this.innerHTML = "> " + this.innerHTML;
          this.removeAttribute("contenteditable");
          newLI = document.getElementsByClassName("new");
          while (li = newLI[0]) {
            li.className = li.className.replace(/(^| )new( |$)/, "");
          }
          return callback(this.innerHTML);
        }
      };
      return field.focus();
    };

    return BrowserInterface;

  })(AdventureInterface);

  this.BrowserInterface = BrowserInterface;

}).call(this);
