import { Controller, Get, Param, Post, UseInterceptors, Bind, UploadedFile, Res, Delete } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ILogger, LoggerService } from "../logger/logger.service";
import { editFileName } from "../utils/image-upload.utils";
import { diskStorage } from "multer";
import * as fs from "fs";
import { FailureResponseDto } from "../dto/response/failure-response.dto";
import { SuccessResponseDto } from "../dto/response/success-response.dto";
import { ResponseDto } from "../dto/response/response.dto";
import { BackendConfig } from "../backend.config";

interface IUploadedFile { 
    fieldname: string;
    originalname: boolean; 
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
}


@Controller("profile-image")
export class ProfileImageController {
    private readonly ROUTE_AVATARS = "/profile-image/";

    private log: ILogger;
    public constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("ProfileImageController");
    }

    @Post("upload")
    @UseInterceptors(FileInterceptor("image", {
        storage: diskStorage({
            destination: BackendConfig.IMAGE_STORAGE_PATH,
            filename: editFileName
        })
    }))
    @Bind(UploadedFile())
    public uploadFile(file: IUploadedFile): ResponseDto {
        this.log.d("The avatar is saved for user: " + file);
        return new SuccessResponseDto(this.ROUTE_AVATARS + file.filename);
    }

    @Get("/:userAddress/status")
    public checkStatus(@Param("userAddress") hash): ResponseDto {
        this.log.d("Request to get avatar: " + hash);
        let ret: ResponseDto;
        if(fs.existsSync(BackendConfig.IMAGE_STORAGE_PATH + hash)) {
            this.log.d("Avatar available: " + hash);
            ret =  new SuccessResponseDto(this.ROUTE_AVATARS + hash);            
        } else {
            this.log.d("User avatar does not exist: " + hash);
            ret = new FailureResponseDto(BackendConfig.STATUS_NOT_FOUND, "User avatar not available");
        }
        return ret;
    }
    
    @Get(":userAddress")
    public getUploadedFile(@Param("userAddress") hash, @Res() res) {
        this.log.d("Getting avatar: " + hash);
        res.sendFile(hash, { root: BackendConfig.IMAGE_STORAGE_PATH });
    }

    @Delete(":userAddress")
    public deleteAvatar(@Param("userAddress") hash): ResponseDto {
        this.log.d("Erasing avatar: " + hash);
        fs.unlinkSync(BackendConfig.IMAGE_STORAGE_PATH + hash);
        return new SuccessResponseDto("Image deleted");
    }
}
