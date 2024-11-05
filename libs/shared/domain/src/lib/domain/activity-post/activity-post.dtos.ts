import { IsString } from 'class-validator';


/**
 * Activity Post DTOs
 * 
 * DTOs are a data structure that define the incoming arguments for an
 * orchestration call (1+ arguments). 
 * 
 * Ex:
 * GetActivityPostDto => Defines the arguments for the 'get' orchestration
 *                       call. Simply takes in a post ID string so that 
 *                       the server is able to fetch the post from the DB.
 */
export abstract class GetActivityPostDto {
  @IsString()
  postId!: string;
}

export abstract class CreateActivityPostDto {
  @IsString()
  poiId!: string;
}

export abstract class DisableActivityPostDto {
  @IsString()
  postId!: string;
}

export abstract class EnableActivityPostDto {
  @IsString()
  postId!: string;
}

export abstract class LikeActivityPostDto {
  @IsString()
  postId!: string;
}

export abstract class UnlikeActivityPostDto {
  @IsString()
  postId!: string;
}

export abstract class DigestActivityPostDto {
  @IsString()
  startDate!: string;
}

export abstract class DisplayCommentsDto {
  @IsString()
  postId!: string;
}
