import React,{useState, useEffect} from 'react';

const ByUserAddiction2 = () => {


  return(
    <>
    <div className='AppPage userLst fixed'>
      <UserListTitle 
        classroomCnt={classroomCnt} brosCnt={brosCnt} 
        uprms={uprms}
      />
    </div>
    <div className='AppPage userLst scroll' id='userscroll322'>
      <UserlistElms 
        users={fusers} stdDate={stdDate}
        editOn={editOn}
        // open={open} setopen={setopen}
        uids={uids} setuids={setuids}
        uprms={uprms}
        setSnack={setSnack}
        classroomCnt={classroomCnt} brosCnt={brosCnt}
        // setSnack={setSnack}
        setBrosErrExist={setBrosErrExist}
      />
      {brosErrExist === true && kdChk &&
        <div style={{padding:8, color: red[900]}}>
          兄弟順位や保護者名などが赤く表示されているときは兄弟設定に問題がある場合があります。
          設定の見直しをお勧めします。
        </div>
      }
      <mui.FabAddEdit 
        clickHandler={e => fabClickHandler(e)} 
        editOn={editOn} hideAdd={hideAdd}
        // swapOn={swapOn}
      />
      <UserSortDialog
        open={userSortOpen} setopen={setUserSortOpen}
        res={userSortRes} setres={setUserSortRes}
        uids={uids} setuids={setuids}
      />
    </div>
    <GetNextHist />
    <SnackMsg {...snack} />
    </>
  )
}
export default ByUserAddiction2;