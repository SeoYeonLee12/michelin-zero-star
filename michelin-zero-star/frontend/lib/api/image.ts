import { apiFetch } from "./client"

export interface ImageResponse {
    imageUrl: string
}

/**
 * 단일 이미지 업로드
 * @param file 업로드할 이미지 파일
 * @returns 업로드된 이미지 URL
 */
export async function uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append("file", file)

    const response = await apiFetch<ImageResponse>("/api/v1/images", {
        method: "POST",
        body: formData,
    })

    return response.imageUrl
}

/**
 * 다중 이미지 업로드
 * @param files 업로드할 이미지 파일 배열
 * @returns 업로드된 이미지 URL 배열
 */
export async function uploadImages(files: File[]): Promise<string[]> {
    const formData = new FormData()
    files.forEach((file) => {
        formData.append("files", file)
    })

    return apiFetch<string[]>("/api/v1/images/bulk", {
        method: "POST",
        body: formData,
    })
}
