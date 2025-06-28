"use client"

import { useState } from 'react'
import EditorPane from './EditorPane'
import LLMPane from './LLMPane';

export default function ChatEditorLayout(){
    const [selectedText, setSelectedText] = useState("")

    const handleTextSelect = (text: string) => {
        setSelectedText(text)
    }

    return(
        <div className='h-screen w-screen flex overflow-hidden bg-background'>
            <LLMPane selectedText={selectedText} />
            <EditorPane onTextSelect={handleTextSelect} />
        </div>
    );
};