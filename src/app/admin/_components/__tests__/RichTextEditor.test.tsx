import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";

// Mock CKEditor 5 — requires browser globals not available in jsdom.
vi.mock("ckeditor5", () => ({
  ClassicEditor: class {},
  Essentials: class {},
  Autoformat: class {},
  Paragraph: class {},
  Bold: class {},
  Italic: class {},
  Underline: class {},
  Strikethrough: class {},
  Subscript: class {},
  Superscript: class {},
  Font: class {},
  FontSize: class {},
  FontFamily: class {},
  FontColor: class {},
  FontBackgroundColor: class {},
  Heading: class {},
  Alignment: class {},
  List: class {},
  ListProperties: class {},
  TodoList: class {},
  Link: class {},
  AutoLink: class {},
  Image: class {},
  ImageCaption: class {},
  ImageStyle: class {},
  ImageToolbar: class {},
  ImageUpload: class {},
  ImageResizeEditing: class {},
  ImageResizeHandles: class {},
  ImageInsert: class {},
  ImageInsertViaUrl: class {},
  MediaEmbed: class {},
  Table: class {},
  TableToolbar: class {},
  TableProperties: class {},
  TableCellProperties: class {},
  TableColumnResize: class {},
  TableCaption: class {},
  CodeBlock: class {},
  Code: class {},
  BlockQuote: class {},
  Indent: class {},
  IndentBlock: class {},
  Highlight: class {},
  HorizontalLine: class {},
  HtmlEmbed: class {},
  FindAndReplace: class {},
  SelectAll: class {},
  RemoveFormat: class {},
  SpecialCharacters: class {},
  SpecialCharactersArrows: class {},
  SpecialCharactersCurrency: class {},
  SpecialCharactersEssentials: class {},
  SpecialCharactersLatin: class {},
  SpecialCharactersMathematical: class {},
  SpecialCharactersText: class {},
  PageBreak: class {},
  WordCount: class {},
  AutoImage: class {},
  PastePlainText: class {},
  TextPartLanguage: class {},
  ShowBlocks: class {},
  SourceEditing: class {},
  GeneralHtmlSupport: class {},
  Undo: class {},
}));

vi.mock("@ckeditor/ckeditor5-react", () => ({
  CKEditor: ({ data }: { data: string }) => (
    <div data-testid="ckeditor" data-value={data} />
  ),
}));

vi.mock("ckeditor5/ckeditor5.css", () => ({}));

import RichTextEditor from "../ui/RichTextEditor";

afterEach(() => {
  cleanup();
});

describe("RichTextEditor", () => {
  it("renders the CKEditor component", async () => {
    const { getByTestId } = render(
      <RichTextEditor value="<p>Hello</p>" onChange={() => {}} />
    );
    const editor = await waitFor(() => getByTestId("ckeditor"));
    expect(editor).toBeTruthy();
    expect(editor.getAttribute("data-value")).toBe("<p>Hello</p>");
  });

  it("renders with empty value", async () => {
    const { getByTestId } = render(
      <RichTextEditor value="" onChange={() => {}} />
    );
    expect(await waitFor(() => getByTestId("ckeditor"))).toBeTruthy();
  });
});
