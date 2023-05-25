 import { set } from 'lodash'
import React, { useEffect, useState } from 'react'

const lol = () => {
    const [admin, setAdmin] = useState(false)
    useEffect(()=>{
        localStorage.getItem("user").token
        fetch("",{
            header:{
                auth: "Bearer "+token;
            }
        }).then((res)=>{
            if(res.status===200)
                setAdmin(true)
            setAdmin(false)
        })
        if(!admin)
            navigate("/")
    })
  return(
    {admin && <div>Hello</div>}
    <></>
  )
}

export default lol