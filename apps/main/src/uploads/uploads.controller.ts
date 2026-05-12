import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Types } from 'mongoose';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { UserDocument } from '../users/schemas/user.schema';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UploadsService } from './uploads.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.storeImage(file);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateAttachmentDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.uploadsService.upload(file, dto, String(user._id));
  }

  @Get('work/:workId')
  findByWork(@Param('workId', ParseObjectIdPipe) workId: Types.ObjectId) {
    return this.uploadsService.findByWork(String(workId));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.uploadsService.remove(String(id));
  }
}
