const escape = require('escape-html');
const fs = require('fs');

/**
 * Callback populating a table.
 *
 * @callback TableGenerator
 * @param {TableWriter} writer Used to create rows in the table.
 * @returns {void}
 */

/**
 * Callback populating a table row.
 *
 * @callback TableRowGenerator
 * @param {TableRowWriter} writer Used to create cells in the table row.
 * @returns {void}
 */

/**
 * Callback populating content.
 *
 * @callback ContentGenerator
 * @param {ContentWriter} writer Used to create content.
 * @returns {void}
 */

/**
 * Callback populating a document.
 *
 * @callback DocumentGenerator
 * @param {DocumentWriter} writer Used to create content.
 * @returns {void}
 */

class Writer {
  /**
   * @param {fs.WriteStream} writeStream The stream to wrap.
   */
  constructor(writeStream) {
    this.writeStream = writeStream;
  }

  class(classNames) {
    this.classAttributeValue = classNames;
  }

  /**
   * Consumes the attribute value(s) and then resets them to undefined.
   * The idea is that this method is called when the next element is generated.
   *
   * @returns {string[]} Zero or more attribute strings in `key=value` form.
   */
  useAttributes() {
    const classValue = this.classAttributeValue;
    this.classAttributeValue = undefined;
    return classValue ? [`class="${classValue}"`] : [];
  }

  /**
   * Write raw HTML.
   *
   * @param {string} chunk The raw contents to write.
   */
  write(chunk) {
    this.writeStream.write(chunk);
  }

  /**
   * Write plain text, with HTML special characters escaped.
   *
   * @param {string} text The plain text to write.
   */
  text(text) {
    this.write(escape(text));
  }
}

class ContentWriter extends Writer {
  h(depth, text) {
    const attributes = this.useAttributes();
    this.write(`<h${depth} ${attributes.join(' ')}>${escape(text)}</h${depth}>`);
  }

  /**
   * Create a table.
   *
   * @param {TableGenerator} generator Code to populate the table. Called synchronously.
   */
  table(generator) {
    const attributes = this.useAttributes();
    this.write(`<table ${attributes.join(' ')}>`);
    generator(new TableWriter(this.writeStream));
    this.write('</table>');
  }
}

/**
 * Utility wrapping a writeable stream, offering methods to fluidly write an HTML document to it.
 */
class DocumentWriter extends ContentWriter {
  constructor(properties, writeStream) {
    super(writeStream);
    this.properties = properties ?? {};
    this.documentCalled = false;
  }

  /**
   * Create the document.
   * This method may only be called once.
   *
   * @param {ContentGenerator} generator Code to populate the document. Called synchronously.
   */
  document(generator) {
    if (this.documentCalled) {
      throw new Error('Only a single document may be written for a single writer instance.');
    }
    this.documentCalled = true;

    this.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="tailwind.css" rel="stylesheet">
          <title>${this.properties.title || 'Document'}</title>
        </head>
        <body>
          <div class="my-1 mx-2">
    `);
    generator(new ContentWriter(this.writeStream));
    this.write(`
          </div>
        </body>
      </html>
    `);
  }
}

class TableWriter extends Writer {
  /**
   * Create a table row.
   *
   * @param {TableRowGenerator} generator Code to populate the table row. Called synchronously.
   */
  row(generator) {
    const attributes = this.useAttributes();
    this.write(`<tr ${attributes.join(' ')}>`);
    generator(new TableRowWriter(this.writeStream));
    this.write('</tr>');
  }
}

class TableRowWriter extends Writer {
  columnSpan(count) {
    this.columnSpanAttributeValue = count;
  }

  useAttributes() {
    const attributes = super.useAttributes();
    const columnSpanValue = this.columnSpanAttributeValue;
    this.columnSpanAttributeValue = undefined;
    return columnSpanValue ? [`colspan=${columnSpanValue}`, ...attributes] : attributes;
  }

  /**
   * Create a table cell.
   *
   * @param {ContentGenerator} generator Code to populate the table cell. Called synchronously.
   */
  cell(generator) {
    const attributes = this.useAttributes();
    this.write(`<td ${attributes.join(' ')}>`);
    generator(new ContentWriter(this.writeStream));
    this.write('</td>');
  }
}

module.exports = {
  DocumentWriter,
  TableWriter,
};
