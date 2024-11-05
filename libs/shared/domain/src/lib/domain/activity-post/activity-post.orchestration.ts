import { IOperation } from '@orcha/common';
import { CreateActivityPostDto, 
         DigestActivityPostDto, 
         DisableActivityPostDto, 
         EnableActivityPostDto, 
         LikeActivityPostDto, 
         UnlikeActivityPostDto, 
         GetActivityPostDto} from './activity-post.dtos';
import { ActivityPost } from './activity-post.model';


/**
 * Activity Post Orchestration.
 * 
 * Orchestrations are VERY IMPORTANT. They define the methods that connect the
 * client-server together by specifying the names of the methods, their return
 * values, and the DTO (input arguments). The 'IActivityPostOrchestration' 
 * defines the interface for the orchestrations that Activity Posts will have;
 * however, both the server and client must implement the interface in order
 * to allow client to call the server and fetch data as required.
 * 
 * Ex:
 * 'get' => defines the interface for a 'get' method which enables the client to 
 *          call the server (while passing a DTO input) to fetch an individual 
 *          Activity Post.
 */
export interface IActivityPostOrchestration {
  list: IOperation<ActivityPost[]>;

  get: IOperation<ActivityPost, GetActivityPostDto>;
  create: IOperation<ActivityPost, CreateActivityPostDto>;

  enable: IOperation<ActivityPost, EnableActivityPostDto>;
  disable: IOperation<ActivityPost, DisableActivityPostDto>;

  like: IOperation<ActivityPost, LikeActivityPostDto>;
  unlike: IOperation<ActivityPost, UnlikeActivityPostDto>;

  digest: IOperation<ActivityPost[], DigestActivityPostDto>;
}
