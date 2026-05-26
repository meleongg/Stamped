import { MAP_DIMENSIONS } from "../constants";

/**
 * Converts SVG element to canvas with white background
 */
const svgToCanvas = (svgElement: SVGSVGElement): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Set canvas size
      canvas.width = MAP_DIMENSIONS.WIDTH;
      canvas.height = MAP_DIMENSIONS.HEIGHT;

      // Convert SVG to blob URL
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      // Create image and draw to canvas
      const img = new Image();
      img.onload = () => {
        // Set white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, MAP_DIMENSIONS.WIDTH, MAP_DIMENSIONS.HEIGHT);

        // Draw the SVG image
        ctx.drawImage(img, 0, 0);

        // Cleanup and resolve
        URL.revokeObjectURL(svgUrl);
        resolve(canvas);
      };

      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        reject(new Error("Could not load SVG image"));
      };

      img.src = svgUrl;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Downloads a blob as a file
 */
const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generates a filename with current date
 */
const generateMapFilename = (): string => {
  const date = new Date().toISOString().split("T")[0];
  return `my-travel-map-${date}.png`;
};

/**
 * Exports SVG map as PNG file download
 */
export const exportMapAsPNG = async (
  svgElement: SVGSVGElement,
): Promise<void> => {
  if (typeof window === "undefined") {
    throw new Error("Window not available");
  }

  const canvas = await svgToCanvas(svgElement);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not create image blob"));
        return;
      }

      downloadBlob(blob, generateMapFilename());
      resolve();
    }, "image/png");
  });
};

/**
 * Copies SVG map as PNG to clipboard
 */
export const copyMapToClipboard = async (
  svgElement: SVGSVGElement,
): Promise<void> => {
  if (typeof window === "undefined") {
    throw new Error("Window not available");
  }

  const canvas = await svgToCanvas(svgElement);

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error("Could not create image blob"));
        return;
      }

      try {
        // Check if clipboard API is supported
        if (navigator.clipboard && window.ClipboardItem) {
          const clipboardItem = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([clipboardItem]);
          resolve();
        } else {
          // Fallback: download the file instead
          downloadBlob(blob, generateMapFilename());
          throw new Error("Clipboard not supported. File downloaded instead.");
        }
      } catch (clipboardError) {
        reject(clipboardError);
      }
    }, "image/png");
  });
};
