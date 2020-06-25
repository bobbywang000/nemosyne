import * as MarkdownIt from 'markdown-it';
import { ContentType } from '../enums';

export class ContentFormatter {
    private md = new MarkdownIt();

    format(content: string, contentType: ContentType): string {
        switch (contentType) {
            case ContentType.HTML:
                return content;
            case ContentType.MARKDOWN:
                return this.md.render(content);
            case ContentType.PLAINTEXT:
                return `<code>${content}</code>`;
        }
    }
}
