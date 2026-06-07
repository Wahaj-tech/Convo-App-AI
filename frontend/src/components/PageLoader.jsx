import React from 'react'
//npm i lucide-react   for icons
import {Loader} from 'lucide-react'
const PageLoader = () => {
  return (
    <div className='flex h-screen items-center justify-center' style={{ background: '#f1f0ec' }}>
        <Loader className="size-10 animate-spin" style={{ color: '#ea580c' }} />
    </div>
  )
}

export default PageLoader