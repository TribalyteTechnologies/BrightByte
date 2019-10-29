import { Controller, Get, Param, Post, UseInterceptors, Bind, UploadedFile, Res, HttpStatus } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ILogger, LoggerService } from "../logger/logger.service";
import { editFileName } from "../utils/image-upload.utils";
import { diskStorage } from "multer";

@Controller("profile-image")
export class ProfileImageController {
    private log: ILogger;
    public constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("Profile Image Controller");
    }

    @Post("upload")
    @UseInterceptors(FileInterceptor("image", {
        storage: diskStorage({
            destination: "./public",
            filename: editFileName
        })
    }))
    @Bind(UploadedFile())
    public uploadFile(file) {
        this.log.d("The avatar is saved: " + file.filename);
        const response = {
            status: HttpStatus.OK,
            filename: file.filename
        };
        return response;
    }

    @Get(":hash")
    public seeUploadedFile(@Param("hash") image, @Res() res) {
        this.log.d("Getting avatar: " + image);
        res.sendFile(image, { root: "./public" });
    }
}
