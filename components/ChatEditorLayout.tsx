"use client"

import { useState } from 'react'
import EditorPane from './EditorPane'
import LLMPane from './LLMPane';

export default function ChatEditorLayout(){
    const [selectedText, setSelectedText] = useState("")
    const [mobileView, setMobileView] = useState<'llm' | 'editor'>('llm')

    const handleTextSelect = (text: string) => {
        setSelectedText(text)
    }

    return(
        <div className='h-screen w-screen flex flex-col overflow-hidden bg-background'>
            {/* Mobile Slider Button - Only visible on mobile */}
            <div className='md:hidden flex-shrink-0 flex justify-center p-4 border-b border-border'>
                <div className='flex items-center bg-muted rounded-lg p-1'>
                    <button
                        onClick={() => setMobileView('llm')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            mobileView === 'llm' 
                                ? 'bg-background text-foreground shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Turbo Assistant
                    </button>
                    <button
                        onClick={() => setMobileView('editor')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            mobileView === 'editor' 
                                ? 'bg-background text-foreground shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Editor
                    </button>
                </div>
            </div>

            {/* Desktop Layout - Hidden on mobile */}
            <div className='hidden md:flex flex-1 overflow-hidden'>
                <LLMPane selectedText={selectedText} />
                <EditorPane onTextSelect={handleTextSelect} />
            </div>

            {/* Mobile Layout - Only visible on mobile */}
            <div className='md:hidden flex-1 overflow-hidden'>
                {mobileView === 'llm' ? (
                    <LLMPane selectedText={selectedText} />
                ) : (
                    <EditorPane onTextSelect={handleTextSelect} />
                )}
            </div>
        </div>
    );
};