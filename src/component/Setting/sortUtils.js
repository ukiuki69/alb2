export const sortUsers = (users, selectedOrder) => {
  const { order, includeServiceUnit } = selectedOrder;
  let sortedUsers = [...users];
  if (!order) return sortedUsers;
  switch (order) {
    case 'userAlphabetical':
      sortedUsers.sort((a, b) => a.kana.localeCompare(b.kana));
      break;
    case 'guardianAlphabeticalAge':
      sortedUsers.sort((a, b) => {
        const result = a.pkana.localeCompare(b.pkana);
        return result !== 0 ? result : b.ageNdx - a.ageNdx;
      });
      break;
    case 'schoolAgeAlphabetical':
      sortedUsers.sort((a, b) => {
        const result = a.ageNdx - b.ageNdx;
        return result !== 0 ? result : a.kana.localeCompare(b.kana);
      });
      break;
    case 'startDate':
      sortedUsers.sort((a, b) => a.startDate.localeCompare(b.startDate));
      break;
    case 'contractDate':
      sortedUsers.sort((a, b) => a.contractDate.localeCompare(b.contractDate));
      break;
    case 'schoolAlphabeticalAge':
      sortedUsers.sort((a, b) => {
        const result = a.belongs1.localeCompare(b.belongs1);
        return result !== 0 ? result : a.ageNdx - b.ageNdx;
      });
      break;
    case 'schoolAlphabeticalUser':
      sortedUsers.sort((a, b) => {
        const result = a.belongs1.localeCompare(b.belongs1);
        return result !== 0 ? result : a.kana.localeCompare(b.kana);
      });
      break;
    default:
      break;
  }

  if (includeServiceUnit) {
    sortedUsers.sort((a, b) => {
      const serviceComparison = a.service.split(',')[0].localeCompare(b.service.split(',')[0]);
      if (serviceComparison !== 0) return serviceComparison;
      return a.classroom.split(',')[0].localeCompare(b.classroom.split(',')[0]);
    });
  }
  
  // endDateが設定されているユーザーを最後に配置
  sortedUsers.sort((a, b) => {
    const aEndDate = a.endDate === "0000-00-00" ? null : a.endDate;
    const bEndDate = b.endDate === "0000-00-00" ? null : b.endDate;
    
    if (aEndDate && !bEndDate) return 1;
    if (!aEndDate && bEndDate) return -1;
    return 0;
  });

  // sindexを10刻みで設定
  sortedUsers.forEach((user, index) => {
    user.sindex = index * 10 + 100;
  });

  return sortedUsers;
}; 