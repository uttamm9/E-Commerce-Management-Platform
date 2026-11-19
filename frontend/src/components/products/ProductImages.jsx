import React from 'react';
import { Upload, X, Trash2 } from 'lucide-react';

const ProductImages = ({
  existingImages = [],
  newFiles = [],
  onNewFilesChange,
  onDeleteExisting,
}) => {
  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      onNewFilesChange([...newFiles, ...filesArray]);
    }
  };

  const handleRemoveNew = (index) => {
    const updated = newFiles.filter((_, i) => i !== index);
    onNewFilesChange(updated);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Product Images (AWS S3 Storage)
      </label>

      {/* Existing Cloud Images */}
      {existingImages.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Saved Cloud Images:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {existingImages.map((img) => (
              <div
                key={img.key || img.url}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200"
              >
                <img
                  src={img.url}
                  alt="Product"
                  className="w-full h-full object-cover"
                />
                {onDeleteExisting && (
                  <button
                    type="button"
                    onClick={() => onDeleteExisting(img.key)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white shadow-sm opacity-90 hover:opacity-100 transition-opacity"
                    title="Delete image from AWS S3"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Local Image Previews */}
      {newFiles.length > 0 && (
        <div>
          <p className="text-xs text-indigo-600 font-medium mb-2">
            Selected for Upload ({newFiles.length}):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {newFiles.map((file, idx) => {
              const previewUrl = URL.createObjectURL(file);
              return (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-indigo-200"
                >
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveNew(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-gray-900/80 text-white hover:bg-gray-900 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* File Upload Trigger */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-500 hover:bg-indigo-50/20 transition-colors">
        <Upload className="mx-auto h-8 w-8 text-gray-400" />
        <div className="mt-2 text-sm text-gray-600">
          <label
            htmlFor="file-upload"
            className="cursor-pointer font-semibold text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
          >
            <span>Click to upload images</span>
            <input
              id="file-upload"
              name="images"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB each</p>
        </div>
      </div>
    </div>
  );
};

export default ProductImages;
