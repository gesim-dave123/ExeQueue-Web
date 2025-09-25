import prisma from "../../prisma/prisma.js"
export const getRequestTypes = async(req,res) =>{
  try {
    
    const requestTypes = await prisma.requestType.findMany({
      orderBy:{
        requestTypeId: "asc"
      },
      select:{
        requestTypeId: true,
        requestName: true,
      }
    })
    if(!requestTypes) return res.status(403).json({success: false, message: "An error occurred when fetching request types"})

    return res.status(200).json({
      success: true,
      message: "Successfully fetched reqeust Types",
      requestType: requestTypes
    })

  } catch (error) {
    console.error("Error in Request ROute: ", error)
    return res.status(500).json({
      success:false,
      message: "Internal Server Error!"
    })
  }
}