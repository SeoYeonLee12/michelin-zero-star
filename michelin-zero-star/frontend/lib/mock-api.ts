/**
 * Mock API 함수들
 * 개발/테스트 목적으로 실제 API 대신 사용할 수 있습니다.
 * 백엔드 없이도 프론트엔드를 테스트할 수 있습니다.
 */

import type { LocationRequestDto, LocationResponseDto } from "./types"

// 🔧 고정 좌표 설정 (항상 이 위치를 반환)
const FIXED_LATITUDE = 36.3549777
const FIXED_LONGITUDE = 127.2983403
const FIXED_LOCATION_ADDRESS = "대전 유성구 대학로"
const FIXED_LOCATION_CODE = "3018010700"

/**
 * Mock 위치 인증 API
 * 입력받은 좌표와 관계없이 항상 고정된 위치를 반환합니다.
 * 배포 시에도 동일한 좌표를 사용합니다.
 */
export async function mockVerifyUserLocation(
  locationData: LocationRequestDto,
): Promise<LocationResponseDto> {
  // 네트워크 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const { latitude, longitude } = locationData

  // 📍 디버깅: Mock 함수에서 받은 좌표 (참고용)
  console.log("🎭 Mock 함수에서 받은 좌표 (참고용 - 무시됨):")
  console.log(`   입력 Latitude:  ${latitude}`)
  console.log(`   입력 Longitude: ${longitude}`)

  // 📍 디버깅: 실제 사용될 고정 좌표
  console.log("🔧 고정 좌표로 처리 중:")
  console.log(`   사용 Latitude:  ${FIXED_LATITUDE}`)
  console.log(`   사용 Longitude: ${FIXED_LONGITUDE}`)

  // 항상 고정된 주소 반환
  const locationAddress = FIXED_LOCATION_ADDRESS
  const locationCode = FIXED_LOCATION_CODE

  console.log("✅ 고정 위치 반환:")
  console.log(`   주소: ${locationAddress}`)
  console.log(`   코드: ${locationCode}`)

  return {
    message: `현재 위치 '${locationAddress}' 인증이 완료되었습니다.`,
    locationAddress,
    locationCode,
  }
}
