package pusher.helpers;

import com.pusher.rest.Pusher;

public class PusherFactory {
		
	public static Pusher getPusher(String appId, String apiKey, String apiSecret, String cluster){
		Pusher pusherObject = new Pusher(appId,apiKey,apiSecret);
		pusherObject.setCluster(cluster);
		return pusherObject;
	}	
}
