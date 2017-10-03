package pusher.helpers;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import com.mendix.core.Core;
import com.mendix.core.CoreException;
import com.mendix.core.objectmanagement.member.MendixEnum;
import com.mendix.systemwideinterfaces.core.IContext;
import com.mendix.systemwideinterfaces.core.IMendixIdentifier;
import com.mendix.systemwideinterfaces.core.IMendixObject;
import com.mendix.systemwideinterfaces.core.IMendixObjectMember;
import com.mendix.systemwideinterfaces.core.meta.IMetaEnumValue;

public class PusherMessage {
	
	private String guid;
	private String objectType;
	private Map<String,Object> attributes;
	
	public PusherMessage(IMendixObject IObject, final IContext context){
		this.guid = String.valueOf(IObject.getId().toLong());
		this.objectType = IObject.getType();
		this.attributes = new HashMap<String,Object>();
		Map<String, ? extends IMendixObjectMember<?>> members = IObject.getMembers(context);
		for (Map.Entry<String, ? extends IMendixObjectMember<?>> entry : members.entrySet()){
		     this.attributes.put(entry.getKey(), new Attribute(entry.getValue(),context));
		}
	}
	// Nested class to create the same structure as in the json format
	// The JSON format for an MxObject in Mx 6 is the following
	/*{
	"objectType": "TestSuite.Order",
	"guid": "5348024557504568",
	"attributes": {
		"DeliveryDateTime": {
			"value": 1490879097695
		},
		"Attribute": {
			"value": "7318349394477057"
		},
		"createdDate": {
			"value": 1490879097695
		},
		"AddressLine": {
			"value": "Order 6"
		},
		"PhoneNumber": {
			"value": ""
		},
		"Selected": {
			"value": false
		}
	}
}*/
	
	class Attribute {
		Object value;
		
		public Attribute(IMendixObjectMember<?> member, IContext context){
			this.value = getMemberValue(member.getValue(context),context);
		}
		
		private Object getMemberValue( Object value, IContext context )
		{		
			//Empty attribute
			if ( value == null ) {
				return "";
			}
			//String attribute
			else if ( value instanceof String ) {
				return value;
			}
			//Integer attribute
			else if ( value instanceof Integer ) {
				return ((Integer)value).toString();
			}
			//Boolean attribute
			else if ( value instanceof Boolean ) {
				return value;
			}
			//Float/Currency attribute
			else if ( value instanceof Double ) {
				return getFormattedNumber(context, (Double) value, 2, 20);
			}
			//Float/Currency attribute
			else if ( value instanceof Float ) {
				return getFormattedNumber(context, Double.valueOf((Float) value), 2, 20);
			}
			//DateTime attribute
			else if ( value instanceof Date ) {
				return new Long(((Date) value).getTime());
			}
			//Long attribute
			else if ( value instanceof Long ) {
				return value;
			}
			//Decimal attribute
			else if ( value instanceof BigDecimal ) {
				return ((BigDecimal)value).toString();
			}
			//Enumeration attribute
			else if ( value instanceof MendixEnum ) {
				MendixEnum enumeration = (MendixEnum) value;
					return enumeration.getValue(context);
			}
			//Reference
			else if (value instanceof IMendixIdentifier){
				return new Long(((IMendixIdentifier) value).toLong()).toString();
			}
			//Reference set
			else if (value instanceof ArrayList){
				ArrayList<String> result = new ArrayList<String>();
				for (IMendixIdentifier im: ((ArrayList<IMendixIdentifier>)value)){
					result.add(new Long(((IMendixIdentifier) im).toLong()).toString());
				}
				return result;
			}
			else
				Core.getLogger(this.toString()).warn("No parser implemented to translate this value to a pusher attribute.");
				return "";
		}
		
		private String getFormattedNumber(IContext context, Double curValue, int minPrecision, int maxPrecision )
		{
			NumberFormat numberFormat = NumberFormat.getInstance(Core.getLocale(context));
			numberFormat.setMaximumFractionDigits(maxPrecision);
			numberFormat.setGroupingUsed(false);
			numberFormat.setMinimumFractionDigits(minPrecision);

			if ( !Double.isNaN(curValue) )
			{
				return numberFormat.format(curValue);
			}

			return "";
		}
		
	}
}
