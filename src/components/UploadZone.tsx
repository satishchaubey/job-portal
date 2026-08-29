import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '../toast';
import * as XLSX from 'xlsx';

interface UploadZoneProps {
  onDataLoaded: (data: any[], headers: string[], fileName: string) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onDataLoaded }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setIsLoading(true);
    setError(null);
    toast.info(`Uploading & parsing "${file.name}"...`, { autoClose: 2000 });
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("Could not read file data");

        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Read headers separately to preserve order and format
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        if (jsonData.length === 0) {
          throw new Error("The selected Excel sheet appears to be empty.");
        }

        // Extract headers from first item keys or sheet structure
        const headers = Object.keys(jsonData[0]);

        onDataLoaded(jsonData, headers, file.name);
      } catch (err: any) {
        console.error(err);
        const msg = err.message || "Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.";
        setError(msg);
        toast.error(`❌ Upload Failed: ${msg}`, { theme: 'colored' });
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      const msg = "File reading error.";
      setError(msg);
      toast.error(`❌ ${msg}`, { theme: 'colored' });
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (validExtensions.includes(fileExtension)) {
        processFile(file);
      } else {
        setError("Invalid file type. Please upload an Excel sheet (.xlsx, .xls) or a CSV file.");
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const loadPreloadedFile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/HR_Contacts_No_Index.xlsx');
      if (!response.ok) {
        throw new Error("Preloaded file HR_Contacts_No_Index.xlsx not found in public folder.");
      }
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

      if (jsonData.length === 0) {
        throw new Error("Preloaded sheet appears to be empty.");
      }

      const headers = Object.keys(jsonData[0]);
      onDataLoaded(jsonData, headers, "HR_Contacts_No_Index.xlsx (Preloaded)");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load the preloaded Excel file.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '2rem' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
      
      <div 
        className={`upload-container ${isDragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        {isLoading ? (
          <div className="upload-icon">
            <Loader2 size={48} className="animate-spin" style={{ color: '#6366f1' }} />
          </div>
        ) : (
          <Upload className="upload-icon" size={48} />
        )}
        
        <h3 className="upload-title">
          {isLoading ? "Processing Excel Sheet..." : "Upload your Excel Sheet"}
        </h3>
        
        <p className="upload-hint">
          Drag and drop your spreadsheet here, or click to browse local files
        </p>

        <div className="button-group">
          <button 
            type="button" 
            className="btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              triggerFileInput();
            }}
            disabled={isLoading}
          >
            <FileSpreadsheet size={18} />
            Choose File
          </button>

          <button 
            type="button" 
            className="btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              loadPreloadedFile();
            }}
            disabled={isLoading}
          >
            Load Preloaded HR Contacts
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          marginTop: '1.25rem', 
          padding: '1rem', 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.3)', 
          borderRadius: '8px',
          color: '#f87171',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          textAlign: 'left'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.9rem' }}>{error}</span>
        </div>
      )}
    </div>
  );
};
