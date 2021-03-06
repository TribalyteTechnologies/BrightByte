import { Response } from "express";
import { Controller, Get, Param, Post, UseInterceptors, Bind, UploadedFile, Response as Res, Delete } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ILogger, LoggerService } from "../logger/logger.service";
import { editFileName } from "../utils/image-upload.utils";
import { diskStorage } from "multer";
import * as fs from "fs";
import { FailureResponseDto } from "../dto/response/failure-response.dto";
import { SuccessResponseDto } from "../dto/response/success-response.dto";
import { ResponseDto } from "../dto/response/response.dto";
import { BackendConfig } from "../backend.config";
import { Observable, of } from "rxjs";

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
    public uploadFile(file: IUploadedFile): Observable<ResponseDto> {
        this.log.d("The avatar is saved for user: " + file);
        return of(new SuccessResponseDto(this.ROUTE_AVATARS + file.filename));
    }

    @Get("/:userAddress/status")
    public checkStatus(@Param("userAddress") hash: string): Observable<ResponseDto> {
        this.log.d("Request to get avatar: " + hash);
        let ret: ResponseDto;
        if(fs.existsSync(BackendConfig.IMAGE_STORAGE_PATH + hash)) {
            this.log.d("Avatar available: " + hash);
            ret =  new SuccessResponseDto(this.ROUTE_AVATARS + hash);            
        } else {
            this.log.d("User avatar does not exists: " + hash);
            ret = new FailureResponseDto(BackendConfig.STATUS_NOT_FOUND, "User avatar not available");
        }
        return of(ret);
    }
    
    @Get(":userAddress")
    public getUploadedFile(@Param("userAddress") hash: string, @Res() res: Response) {
        this.log.d("Getting avatar: " + hash);
        res.sendFile(hash, { root: BackendConfig.IMAGE_STORAGE_PATH });
    }

    @Delete(":userAddress")
    public deleteAvatar(@Param("userAddress") hash: string): Observable<ResponseDto> {
        this.log.d("Erasing avatar: " + hash);
        fs.unlinkSync(BackendConfig.IMAGE_STORAGE_PATH + hash);
        return of(new SuccessResponseDto("Image deleted"));
    }
}
