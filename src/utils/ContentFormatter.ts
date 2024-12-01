import * as MarkdownIt from 'markdown-it';
import { ContentType } from '../enums';

export class ContentFormatter {
    private md = new MarkdownIt({ html: true });

    private linkify(content: string): string {
        // Regular expression to find URLs
        const urlRegex = /(\bhttps?:\/\/[^\s]+)/g;
        return content.replace(urlRegex, (url) => `<a href="${url}">${url}</a>`);
    }

    format(content: string, contentType: ContentType): string {
        switch (contentType) {
            case ContentType.HTML:
                // Assume HTML content is trusted, and links are already embedded
                return content;
            case ContentType.MARKDOWN:
                // Convert URLs in plain markdown to hyperlinks
                const linkifiedMarkdown = this.linkify(content);
                return this.md.render(linkifiedMarkdown);
            case ContentType.PLAINTEXT:
                // Convert URLs in plain text to hyperlinks
                const linkifiedPlaintext = this.linkify(content);
                return `<code>${linkifiedPlaintext}</code>`;
        }
    }
}
