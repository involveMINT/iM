import { IsString } from 'class-validator';

export abstract class CreateCommentDto {
  /**
   * Take in postId and text to create comment.
   * 
   * Service Logic: 
   * hidden => false
   * DateCreated => now()
   * ID => UUID
   * User => Fetched via auth + perform checks.
   * Insert Comment into the database.
   */
  @IsString()
  postId!: string;

  @IsString()
  text!: string;

  @IsString()
  commentsId!: string;

  @IsString()
  handleId!: string;

  @IsString()
  profilePicFilePath!: string;

  @IsString()
  name!: string;
}

export abstract class HideCommentDto {
  /**
   * Take in commentId and hide comment.
   * 
   * Service Logic:
   * Hidden => True
   * User auth done by service + perform checks
   */
  @IsString()
  commentId!: string;
}

export abstract class UnhideCommentDto {
  /**
   * Take in commentId and unhide comment
   * 
   * Service Logic:
   * Hidden => False
   * User auth done by service + perform checks
   */
  @IsString()
  commentId!: string;
}

export abstract class FlagCommentDto {
  /**
   * Take in commentId and flags comment
   * 
   * Service Logic:
   * Flagged => Flagged + 1
   * User auth done by service + perform checks
   */
  @IsString()
  commentId!: string;
}

export abstract class UnflagCommentDto {
  /**
   * Take in commentId and unflags comment
   * 
   * Service Logic:
   * Flagged => Flagged - 1
   * User auth done by service + perform checks
   */
  @IsString()
  commentId!: string;
}