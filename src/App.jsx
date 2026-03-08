import React, { useEffect, useState } from "react";

const AppLoader = ({ children }) => {

  const [loading,setLoading] = useState(true);

  useEffect(()=>{

    setTimeout(()=>{

      setLoading(false);

    },1500);

  },[]);

  if(loading){

    return(

      <div style={{
        height:"100vh",
        background:"#0F0F1A",
        display:"flex",
        justifyContent:"center",
        alignItems:"center",
        flexDirection:"column",
        color:"white"
      }}>

        <img src="/icon-192.png" style={{width:"90px"}}/>

        <h2 style={{marginTop:"20px"}}>AcadeMe</h2>

      </div>

    )

  }

  return children

}

export default AppLoader
