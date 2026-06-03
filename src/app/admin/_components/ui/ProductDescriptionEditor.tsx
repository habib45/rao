// components/custom-editor.js
'use client' // Required only in App Router.

import React from 'react';
import { CKEditor, useCKEditorCloud } from '@ckeditor/ckeditor5-react';

const CustomEditor = () => {
    const cloud = useCKEditorCloud( {
        version: '48.2.0',
        premium: true
    } );

    if ( cloud.status === 'error' ) {
        return <div>Error!</div>;
    }

    if ( cloud.status === 'loading' ) {
        return <div>Loading...</div>;
    }

    const {
        ClassicEditor,
        Essentials,
        Paragraph,
        Bold,
        Italic,
        Underline,
        Strikethrough,
        Subscript,
        Superscript,
        Link,
        List,
        Heading,
        BlockQuote,
        Code,
        CodeBlock,
        Image,
        ImageUpload,
        ImageToolbar,
        ImageCaption,
        ImageStyle,
        ImageResize,
        Table,
        TableToolbar,
        MediaEmbed,
        Alignment,
        Font,
        FontSize,
        Highlight
    } = cloud.CKEditor;

    const { FormatPainter } = cloud.CKEditorPremiumFeatures;

    return (
        <CKEditor
            editor={ ClassicEditor }
            data={ '<p>Hello world!</p>' }
            config={ {
                licenseKey: 'GPL',
                plugins: [
                    Essentials,
                    Paragraph,
                    Bold,
                    Italic,
                    Underline,
                    Strikethrough,
                    Subscript,
                    Superscript,
                    Link,
                    List,
                    Heading,
                    BlockQuote,
                    Code,
                    CodeBlock,
                    Image,
                    ImageUpload,
                    ImageToolbar,
                    ImageCaption,
                    ImageStyle,
                    ImageResize,
                    Table,
                    TableToolbar,
                    MediaEmbed,
                    Alignment,
                    Font,
                    FontSize,
                    Highlight,
                    FormatPainter
                ],
                toolbar: [
                    'undo', 'redo', '|',
                    'heading', '|',
                    'bold', 'italic', 'underline', 'strikethrough', '|',
                    'subscript', 'superscript', '|',
                    'link', '|',
                    'bulletedList', 'numberedList', '|',
                    'blockQuote', 'codeBlock', '|',
                    'imageUpload', '|',
                    'insertTable', '|',
                    'mediaEmbed', '|',
                    'alignment', '|',
                    'fontFamily', 'fontSize', '|',
                    'highlight', '|',
                    'formatPainter'
                ]
            } }
        />
    );
};

export default CustomEditor;
