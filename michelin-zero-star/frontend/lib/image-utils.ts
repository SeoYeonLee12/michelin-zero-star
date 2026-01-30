/**
 * 이미지를 지정된 최대 너비/높이 및 퀄리티로 압축합니다.
 * @param file 원본 파일
 * @param maxWidth 최대 너비 (기본 1280px)
 * @param quality 압축 퀄리티 (0~1, 기본 0.7)
 */
export async function compressImage(
    file: File,
    maxWidth = 1280,
    quality = 0.7
): Promise<File> {
    // 1. 이미지 로드
    const imageBitmap = await createImageBitmap(file)

    // 2. 캔버스 생성 및 크기 계산
    let { width, height } = imageBitmap
    if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
    }

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    // 3. 캔버스에 그리기
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas context failed")
    ctx.drawImage(imageBitmap, 0, 0, width, height)

    // 4. Blob으로 변환 및 File 객체 생성
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("Image compression failed"))
                    return
                }
                // 원본 파일명 유지, 타입은 jpeg/png 등 브라우저 결정
                const compressedFile = new File([blob], file.name, {
                    type: blob.type,
                    lastModified: Date.now(),
                })
                resolve(compressedFile)
            },
            file.type, // 원본 타입 유지 (보통 image/jpeg or image/png)
            quality
        )
    })
}
