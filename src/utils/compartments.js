// Mô hình "xe chia khoang" (khớp backend): mỗi khoang 3 vị trí, một khoang chỉ chở một hạng chuồng.
// Hạng chuồng quyết định số con tối đa trong một khoang: Ghép (Shared) 3, Rưỡi (Comfort) 2, Riêng (Private) 1.

export const POSITIONS_PER_COMPARTMENT = 3;

/** Số con tối đa trong một khoang theo hạng chuồng. */
export const HORSES_PER_COMPARTMENT = { Shared: 3, Comfort: 2, Private: 1 };

/** Thứ tự xếp khi bấm "Tự xếp": Riêng trước, rồi Rưỡi, rồi Ghép. */
export const STALL_CLASS_ORDER = ['Private', 'Comfort', 'Shared'];

/** Màu nhãn hạng chuồng (teal / tím / cam). */
export const STALL_CLASS_COLORS = { Shared: '#0d9488', Comfort: '#7c3aed', Private: '#ea580c' };

/**
 * Số con tối đa một khoang chở được với hạng chuồng này (hạng lạ coi như Ghép).
 * @param {string} stallClass
 * @returns {number}
 */
export const compartmentLimit = (stallClass) => HORSES_PER_COMPARTMENT[stallClass] || POSITIONS_PER_COMPARTMENT;

/**
 * Số khoang cần cho một nhóm ngựa: ceil(Ghép/3) + ceil(Rưỡi/2) + Riêng.
 * @param {Array<{stallClass?: string}>} horses
 * @returns {number}
 */
export function compartmentsNeeded(horses) {
  const count = (cls) => horses.filter((h) => (h.stallClass || 'Shared') === cls).length;
  return STALL_CLASS_ORDER.reduce((sum, cls) => sum + Math.ceil(count(cls) / compartmentLimit(cls)), 0);
}

/**
 * Số khoang của xe; backend cũ chưa trả compartmentCount thì tạm tính theo sức chứa.
 * @param {{compartmentCount?: number, capacityHorses?: number}|null|undefined} vehicle
 * @returns {number}
 */
export function vehicleCompartmentCount(vehicle) {
  if (!vehicle) return 0;
  if (vehicle.compartmentCount) return vehicle.compartmentCount;
  return Math.ceil((vehicle.capacityHorses || 0) / POSITIONS_PER_COMPARTMENT);
}

/**
 * Số ô cũ (stallSlotNumber) tương ứng với khoang + vị trí, để backend cũ vẫn nhận.
 * @param {number} compartmentNo
 * @param {number} positionNo
 * @returns {number}
 */
export const toSlotNumber = (compartmentNo, positionNo) => (compartmentNo - 1) * POSITIONS_PER_COMPARTMENT + positionNo;

/**
 * Khoang + vị trí của một con ngựa trên chuyến; thiếu compartmentNo thì suy từ stallSlotNumber.
 * @param {{compartmentNo?: number, positionNo?: number, stallSlotNumber?: number}} horse
 * @returns {{compartmentNo: number, positionNo: number}|null}
 */
export function positionOf(horse) {
  if (horse?.compartmentNo && horse?.positionNo) return { compartmentNo: horse.compartmentNo, positionNo: horse.positionNo };
  const slot = horse?.stallSlotNumber;
  if (!slot) return null;
  return {
    compartmentNo: Math.ceil(slot / POSITIONS_PER_COMPARTMENT),
    positionNo: ((slot - 1) % POSITIONS_PER_COMPARTMENT) + 1,
  };
}

/**
 * Thứ tự sắp xếp ngựa theo khoang rồi vị trí (ngựa chưa xếp xuống cuối).
 * @param {Object} horse
 * @returns {number}
 */
export function positionSortKey(horse) {
  const pos = positionOf(horse);
  return pos ? toSlotNumber(pos.compartmentNo, pos.positionNo) : Number.MAX_SAFE_INTEGER;
}

/**
 * Chữ "Khoang N · vị trí M" cho một con ngựa (dùng ở màn tài xế, khách hàng, tóm tắt chuyến).
 * @param {(key: string, options?: Object) => string} t
 * @param {Object} horse
 * @returns {string}
 */
export function formatHorsePosition(t, horse) {
  const pos = positionOf(horse);
  if (!pos) return t('customerTrips.noPosition');
  return t('customerTrips.position', { compartment: pos.compartmentNo, position: pos.positionNo });
}

/**
 * Kiểm tra một cách xếp: mỗi khoang chỉ một hạng và không quá số con của hạng đó.
 * @param {Array<{key: number, stallClass?: string}>} horses
 * @param {Record<number, {compartmentNo: number, positionNo: number}|null>} placements
 * @param {number[]} compartmentNos - Chỉ kiểm các khoang này
 * @param {number[]} [movedKeys] - Các con vừa di chuyển: hạng "đang chở" của khoang lấy theo những con còn lại
 * @returns {{reason: 'mixedClass'|'full', compartmentNo: number, stallClass: string, otherClass?: string, limit?: number}|null}
 */
export function findPlacementProblem(horses, placements, compartmentNos, movedKeys = []) {
  for (const no of compartmentNos) {
    const inside = horses
      .filter((h) => placements[h.key]?.compartmentNo === no)
      .sort((a, b) => Number(movedKeys.includes(a.key)) - Number(movedKeys.includes(b.key)));
    if (inside.length === 0) continue;
    const cls = inside[0].stallClass || 'Shared';
    const other = inside.find((h) => (h.stallClass || 'Shared') !== cls);
    if (other) return { reason: 'mixedClass', compartmentNo: no, stallClass: cls, otherClass: other.stallClass || 'Shared' };
    if (inside.length > compartmentLimit(cls)) return { reason: 'full', compartmentNo: no, stallClass: cls, limit: compartmentLimit(cls) };
  }
  return null;
}

/**
 * Tự xếp ngựa vào khoang: Riêng trước, rồi Rưỡi, rồi Ghép; trong mỗi hạng gom ngựa cùng đơn đứng liền nhau
 * (đơn đông trước) để cùng khoang khi có thể. Dùng đúng số khoang tối thiểu cho mỗi hạng.
 * Xe thiếu khoang thì những con không còn chỗ để lại khay chờ.
 * @param {Array<{key: number, stallClass?: string, bookingId?: number}>} horses
 * @param {number} compartmentCount
 * @returns {{placements: Record<number, {compartmentNo: number, positionNo: number}|null>, unplaced: number}}
 */
export function autoArrange(horses, compartmentCount) {
  const placements = {};
  let nextCompartment = 1;
  let unplaced = 0;
  STALL_CLASS_ORDER.forEach((cls) => {
    const ofClass = horses.filter((h) => (h.stallClass || 'Shared') === cls);
    const groups = new Map();
    ofClass.forEach((h) => groups.set(h.bookingId, [...(groups.get(h.bookingId) || []), h]));
    const ordered = [...groups.values()].sort((a, b) => b.length - a.length).flat();
    const limit = compartmentLimit(cls);
    ordered.forEach((h, idx) => {
      const compartmentNo = nextCompartment + Math.floor(idx / limit);
      if (compartmentNo > compartmentCount) {
        placements[h.key] = null;
        unplaced += 1;
        return;
      }
      placements[h.key] = { compartmentNo, positionNo: (idx % limit) + 1 };
    });
    nextCompartment += Math.ceil(ordered.length / limit);
  });
  return { placements, unplaced };
}
