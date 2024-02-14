
// const catchAsync = (fn)=>()=>{
// this high order function
// }

const catchAsync = (fn)=>(req,res,next)=>(
    Promise.resolve(fn(req,res,next)).catch((err)=>next(err))
)
export default catchAsync