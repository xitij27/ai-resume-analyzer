export async function convertPdfToImage(file: File): Promise<PdfConversionResult> {
    if (typeof window === "undefined") {
        return { imageUrl: "", file: null, error: "PDF to image is only available in the browser" };
    }

    const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
    const pdfWorker = await import("pdfjs-dist/build/pdf.worker?url");
    GlobalWorkerOptions.workerSrc = pdfWorker.default;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
            return { imageUrl: "", file: null, error: "Failed to get 2D context" };
        }

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        await page.render({ canvasContext: context, viewport }).promise;

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const originalName = file.name.replace(/\.pdf$/i, "");
                    const imageFile = new File([blob], `${originalName}.png`, { type: "image/png" });
                    resolve({ imageUrl: URL.createObjectURL(blob), file: imageFile });
                } else {
                    resolve({ imageUrl: "", file: null, error: "Failed to create image blob" });
                }
            });
        });
    } catch (err) {
        return { imageUrl: "", file: null, error: `Failed to convert PDF: ${err}` };
    }
}
