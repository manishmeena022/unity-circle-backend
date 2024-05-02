import multer from "multer";
import path from "path";
const AVATAR_PATH = path.join("/public/uploads/users/avatars");


const storage = multer.diskStorage({
    destination : function(req, file, cb){
        cb(null, path.join(__dirname, AVATAR_PATH));
    },
    filename : function(req, file, cb){
        callback(null, file.fieldname + "-" + Date.now());
    }
})

export const upload = multer({ storage, })