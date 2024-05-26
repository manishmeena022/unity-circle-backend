import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const CLOUDINARY_API_SECRET="XzfoRgAIeK8fuFtoEadpbOM3a6o"
const CLOUDINARY_API_KEY="124634137533997"
const CLOUDINARY_CLOUD_NAME="djfst3kwt"

// console.log("CLOUDINARY_API_KEY", process.env.CLOUDINARY_API_KEY)

cloudinary.config({ 
    cloud_name: CLOUDINARY_API_SECRET, 
    api_key:  CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_CLOUD_NAME,
});

const uploadCloudinary = async (localFilePath) => {
    if (!localFilePath) {
        console.log("Local file path is required")
        return null
    }

    try {
        console.log("uploading file on cloudinary", localFilePath)

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        console.log("response", response)
        console.log("file is uploaded on cloudinary", response.url)

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath)
        }
        return response;

    } catch (error) {
        console.log("error uploading file on cloudinary", error)
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath)
        }
        return null
    }
}

export default uploadCloudinary;