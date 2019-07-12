import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { Request, Response } from 'express';

@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) { }

  @Get('commits/:id')
  getCommitNumber(@Req() req: Request, @Res() res: Response) {
    this.databaseService.getCommitNumber(req.params.id)
      .then(response => {
        if (response != null) {
          res.status(200).send(response.toString());
        }
        else {
          res.sendStatus(404);
        }
      });
  }

  @Get('reviews/:id')
  getReviewNumber(@Req() req: Request, @Res() res: Response) {
    this.databaseService.getReviewNumber(req.params.id)
      .then(response => {
        if (response != null) {
          res.status(200).send(response.toString());
        }
        else {
          res.sendStatus(404);
        }
      });
  }

  @Post('users/:id')
  createUser(@Req() req: Request, @Res() res: Response) {
    this.databaseService.createUser(req.params.id)
      .then(response => {
        if (response) {
          res.sendStatus(200);
        }
        else {
          res.sendStatus(404);
        }
      });
  }

  @Post('commits/:id/:commitNumber')
  setCommitNumber(@Req() req: Request, @Res() res: Response) {
    this.databaseService.setCommitNumber(req.params.id, req.params.commitNumber)
      .then(response => {
        if (response) {
          res.sendStatus(200);
        }
        else {
          res.sendStatus(404);
        }
      });
  }

  @Post('reviews/:id/:commitNumber')
  setReviewNumber(@Req() req: Request, @Res() res: Response) {
    this.databaseService.setReviewNumber(req.params.id, req.params.commitNumber)
      .then(response => {
        if (response) {
          res.sendStatus(200);
        }
        else {
          res.sendStatus(404);
        }
      });
  }
}
