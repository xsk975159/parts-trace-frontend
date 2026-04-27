import request from '@/utils/request'

export function getDidList(params) {
  return request({
    url: '/parts/did/list',
    method: 'get',
    params
  })
}

export function generateDidSync(partsId) {
  return request({
    url: `/parts/${partsId}/did/sync`,
    method: 'post'
  })
}

export function bindDid(didId, data) {
  return request({
    url: `/parts/did/${didId}/bind`,
    method: 'post',
    data
  })
}

export function unbindDid(didId) {
  return request({
    url: `/parts/did/${didId}/unbind`,
    method: 'post'
  })
}

export function freezeDid(didId, reason) {
  return request({
    url: `/parts/did/${didId}/freeze`,
    method: 'post',
    params: { reason }
  })
}

export function unfreezeDid(didId) {
  return request({
    url: `/parts/did/${didId}/unfreeze`,
    method: 'post'
  })
}

export function getDidDocument(didId) {
  return request({
    url: `/parts/did/${didId}/document`,
    method: 'get'
  })
}

export function validateDid(did) {
  return request({
    url: '/parts/did/validate',
    method: 'get',
    params: { did }
  })
}

export function initPartsUnits(partsId, unitCount) {
  return request({
    url: `/parts/${partsId}/units/init`,
    method: 'post',
    params: { unitCount }
  })
}

export function generateUnitDid(unitId) {
  return request({
    url: `/parts/unit/${unitId}/did/sync`,
    method: 'post'
  })
}
