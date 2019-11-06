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


@Controller("profile-image")
export class ProfileImageController {
    private readonly PATH_IMAGES = "./public/";

    private log: ILogger;
    public constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("Profile Image Controller");
    }

    @Post("upload")
    @UseInterceptors(FileInterceptor("image", {
        storage: diskStorage({
            destination: "./public/",
            filename: editFileName
        })
    }))
    @Bind(UploadedFile())
    public uploadFile(file): ResponseDto {
        this.log.d("The avatar is saved for user: " + file.filename);
        return new SuccessResponseDto(this.PATH_IMAGES + file.filename);
    }

    @Get("getPath/:hash")
    public getUserPath(@Param("hash") image): ResponseDto {
        this.log.d("Request to get avatar: " + image);        
        if(fs.existsSync(this.PATH_IMAGES + image)) {
            this.log.d("Avatar available: " + image);
            return new SuccessResponseDto(image);            
        } else {
            this.log.d("User avatar does not exist: " + image);
            return new FailureResponseDto(BackendConfig.STATUS_NOT_FOUND, "User avatar not available");
        }
    }
    
    @Get(":hash")
    public getUploadedFile(@Param("hash") image, @Res() res) {
        this.log.d("Getting avatar: " + image);
        res.sendFile(image, { root: "./public" });
    }

    @Delete(":hash")
    public deleteAvatar(@Param("hash") image): ResponseDto {
        this.log.d("Erasing avatar: " + image);
        fs.unlinkSync("./public/" + image);
        return new SuccessResponseDto("Image deleted");
    }
}
