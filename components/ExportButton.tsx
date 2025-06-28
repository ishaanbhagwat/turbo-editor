"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Download, FileText, FileDown } from "lucide-react"
import jsPDF from "jspdf"
import { Document, Packer, Paragraph, TextRun } from "docx"

interface ExportButtonProps {
  content: string
}

export function ExportButton({ content }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const exportAsPDF = async () => {
    if (!content.trim()) return
    
    setIsExporting(true)
    try {
      const pdf = new jsPDF()
      
      // Split content into lines that fit the page
      const lines = pdf.splitTextToSize(content, 180)
      
      // Add title
      pdf.setFontSize(16)
      pdf.text("Document Export", 20, 20)
      
      // Add content
      pdf.setFontSize(12)
      pdf.text(lines, 20, 40)
      
      // Save the PDF
      pdf.save("document-export.pdf")
    } catch (error) {
      console.error("Error exporting PDF:", error)
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  const exportAsWord = async () => {
    if (!content.trim()) return
    
    setIsExporting(true)
    try {
      // Create document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Document Export",
                  bold: true,
                  size: 32
                })
              ]
            }),
            new Paragraph({
              children: [new TextRun({ text: "" })]
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: content,
                  size: 24
                })
              ]
            })
          ]
        }]
      })

      // Generate and download
      const blob = await Packer.toBlob(doc)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'document-export.docx'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting Word document:", error)
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false)
    }
  }

  // Add click outside listener
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={!content.trim() || isExporting}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        {isExporting ? "Exporting..." : "Export"}
      </Button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 min-w-[160px]">
          <button
            onClick={exportAsPDF}
            disabled={isExporting}
            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            Export as PDF
          </button>
          <button
            onClick={exportAsWord}
            disabled={isExporting}
            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 disabled:opacity-50"
          >
            <FileDown className="h-4 w-4" />
            Export as Word
          </button>
        </div>
      )}
    </div>
  )
} 