from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_protect
from django.core.validators import validate_email
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.dateparse import parse_date
from django_ratelimit.decorators import ratelimit

from clients.models import Client
from tickets.models import Ticket


def _clean_str(value):
    """Normalize incoming payload values to a safely stripped string."""
    if value is None:
        return ""
    if isinstance(value, bytes):
        value = value.decode("utf-8", errors="ignore")
    return str(value).strip()


def _safe_get_text(data, key, default=""):
    """Safely read any payload field as text, even when frontend sends numbers."""
    return _clean_str(data.get(key, default))


@ratelimit(key="ip", rate="10/m", method="POST", block=True)
@csrf_protect
@api_view(['POST'])
@permission_classes([AllowAny])
def submit_insurance_form(request):
    """
    Public endpoint for insurance form submission.
    Creates or finds client and creates a ticket automatically.
    """
    try:
        data = request.data

        # Normalize a view of payload so model fields always receive safe values.
        # This prevents crashes like "'int' object has no attribute 'strip'" inside Django field prep.
        if hasattr(data, "items"):
            # request.data may be a DRF QueryDict-like object; build a plain dict for normalization.
            raw_payload = {k: v for k, v in data.items()}
        else:
            raw_payload = data

        # Ensure we only use normalized payload below.
        data = raw_payload
        
        # Extract client information
        first_name = _safe_get_text(data, 'first_name')
        last_name = _safe_get_text(data, 'last_name')
        email = _safe_get_text(data, 'email').lower()
        phone = _safe_get_text(data, 'phone')
        address = _safe_get_text(data, 'address')
        occupation = _safe_get_text(data, 'occupation')
        street_address = _safe_get_text(data, 'street_address')
        street_address_line_2 = _safe_get_text(data, 'street_address_line_2')
        city = _safe_get_text(data, 'city')
        state = _safe_get_text(data, 'state')
        postal_code = _safe_get_text(data, 'postal_code')
        
        # Build full address
        address_parts = []
        if street_address:
            address_parts.append(street_address)
        if street_address_line_2:
            address_parts.append(street_address_line_2)
        if city:
            address_parts.append(city)
        if state:
            address_parts.append(state)
        if postal_code:
            address_parts.append(postal_code)
        
        full_address = ', '.join(address_parts) if address_parts else address
        
        # Validate required fields (return field-level errors so frontend can show inline messages)
        field_errors: dict[str, list[str]] = {}
        if not first_name:
            field_errors["first_name"] = ["First name is required"]
        if not last_name:
            field_errors["last_name"] = ["Last name is required"]
        if not email:
            field_errors["email"] = ["Email is required"]
        if not phone:
            field_errors["phone"] = ["Phone number is required"]

        if field_errors:
            return Response({"success": False, "field_errors": field_errors}, status=status.HTTP_400_BAD_REQUEST)

        # Validate email format
        try:
            validate_email(email)
        except DjangoValidationError:
            field_errors["email"] = ["Invalid email address"]
            return Response({"success": False, "field_errors": field_errors}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find or create client
        client, created = Client.objects.get_or_create(
            email=email,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'phone': phone,
                'occupation': occupation,
                'address': full_address,
            }
        )
        
        # Update client if it already exists
        if not created:
            client.first_name = first_name
            client.last_name = last_name
            client.phone = phone
            client.occupation = occupation or client.occupation
            if full_address:
                client.address = full_address
            client.save()
        
        # Extract insurance form data
        insurance_type = _safe_get_text(data, 'insurance_type')
        insurance_effective_date = _safe_get_text(data, 'insurance_effective_date')
        date_of_birth = _safe_get_text(data, 'date_of_birth')
        currently_insured = _safe_get_text(data, 'currently_insured')
        additional_details = _safe_get_text(data, 'additional_details')
        
        # Build ticket details
        details_dict = {
            "Insurance Type": insurance_type,
            "Currently Insured": currently_insured,
        }
        
        if insurance_effective_date:
            details_dict["Insurance Effective Date"] = insurance_effective_date
        if date_of_birth:
            details_dict["Date of Birth"] = date_of_birth
        
        # Auto Insurance Fields
        if 'Auto' in insurance_type:
            number_of_drivers = _safe_get_text(data, 'number_of_drivers', '1')
            number_of_vehicles = _safe_get_text(data, 'number_of_vehicles', '1')
            driving_license_number = _safe_get_text(data, 'driving_license_number')
            g1_date = _safe_get_text(data, 'g1_date')
            g2_date = _safe_get_text(data, 'g2_date')
            g_date = _safe_get_text(data, 'g_date')
            car_vin_number = _safe_get_text(data, 'car_vin_number')
            one_way_km = _safe_get_text(data, 'one_way_km')
            annual_km = _safe_get_text(data, 'annual_km')
            at_fault_claim = _safe_get_text(data, 'at_fault_claim')
            conviction = _safe_get_text(data, 'conviction')
            
            details_dict["Number of Drivers"] = number_of_drivers
            details_dict["Number of Vehicles"] = number_of_vehicles
            if driving_license_number:
                details_dict["Driving License Number"] = driving_license_number
            if g1_date:
                details_dict["G1 Date"] = g1_date
            if g2_date:
                details_dict["G2 Date"] = g2_date
            if g_date:
                details_dict["G Date"] = g_date
            if car_vin_number:
                details_dict["Car VIN/Model"] = car_vin_number
            if one_way_km:
                details_dict["One Way KM"] = one_way_km
            if annual_km:
                details_dict["Annual KM"] = annual_km
            if at_fault_claim:
                details_dict["At Fault Claim (Last 6 years)"] = at_fault_claim
            if conviction:
                details_dict["Conviction (Last 3 years)"] = conviction
        
        # Home/Tenant Insurance Fields
        if 'Home' in insurance_type or 'Tenant' in insurance_type:
            property_address = _safe_get_text(data, 'property_address')
            property_address_line_2 = _safe_get_text(data, 'property_address_line_2')
            property_city = _safe_get_text(data, 'property_city')
            property_state = _safe_get_text(data, 'property_state')
            property_postal_code = _safe_get_text(data, 'property_postal_code')
            property_type = _safe_get_text(data, 'property_type')
            property_value = _safe_get_text(data, 'property_value')
            year_built = _safe_get_text(data, 'year_built')
            square_footage = _safe_get_text(data, 'square_footage')
            home_claims_history = _safe_get_text(data, 'home_claims_history')
            
            if property_address:
                property_addr_parts = [property_address]
                if property_address_line_2:
                    property_addr_parts.append(property_address_line_2)
                if property_city:
                    property_addr_parts.append(property_city)
                if property_state:
                    property_addr_parts.append(property_state)
                if property_postal_code:
                    property_addr_parts.append(property_postal_code)
                details_dict["Property Address"] = ', '.join(property_addr_parts)
            if property_type:
                details_dict["Property Type"] = property_type
            if property_value:
                details_dict["Property Value"] = f"${property_value}"
            if year_built:
                details_dict["Year Built"] = year_built
            if square_footage:
                details_dict["Square Footage"] = square_footage
            if home_claims_history:
                details_dict["Claims History (Last 5 years)"] = home_claims_history
        
        # Rental Property Insurance Fields
        # Check for rental insurance (handles both "Only Rental property Insurance" and combined types)
        if 'Rental' in insurance_type:
            rental_property_address = _safe_get_text(data, 'rental_property_address')
            rental_property_address_line_2 = _safe_get_text(data, 'rental_property_address_line_2')
            rental_property_city = _safe_get_text(data, 'rental_property_city')
            rental_property_state = _safe_get_text(data, 'rental_property_state')
            rental_property_postal_code = _safe_get_text(data, 'rental_property_postal_code')
            rental_property_type = _safe_get_text(data, 'rental_property_type')
            number_of_units = _safe_get_text(data, 'number_of_units', '1')
            rental_property_value = _safe_get_text(data, 'rental_property_value')
            rental_year_built = _safe_get_text(data, 'rental_year_built')
            rental_income = _safe_get_text(data, 'rental_income')
            
            if rental_property_address:
                rental_addr_parts = [rental_property_address]
                if rental_property_address_line_2:
                    rental_addr_parts.append(rental_property_address_line_2)
                if rental_property_city:
                    rental_addr_parts.append(rental_property_city)
                if rental_property_state:
                    rental_addr_parts.append(rental_property_state)
                if rental_property_postal_code:
                    rental_addr_parts.append(rental_property_postal_code)
                details_dict["Rental Property Address"] = ', '.join(rental_addr_parts)
            if rental_property_type:
                details_dict["Rental Property Type"] = rental_property_type
            if number_of_units:
                details_dict["Number of Units"] = number_of_units
            if rental_property_value:
                details_dict["Rental Property Value"] = f"${rental_property_value}"
            if rental_year_built:
                details_dict["Year Built"] = rental_year_built
            if rental_income:
                details_dict["Monthly Rental Income"] = f"${rental_income}"
            # Also check for square_footage if provided (shared field)
            square_footage = _safe_get_text(data, 'square_footage')
            if square_footage:
                details_dict["Square Footage"] = square_footage

        # Final coercion: ensure model receives strings only for text/JSON fields we set.
        # (JSONField will accept non-strings, but keeping them consistent prevents edge cases.)
        details_dict = {str(k): _clean_str(v) for k, v in (details_dict or {}).items()}
        additional_details = _clean_str(additional_details)
        insurance_type = _clean_str(insurance_type) if insurance_type else "Auto Insurance"
        full_address = _clean_str(full_address)
        
        # Determine source based on authentication
        # If user is authenticated, it's a manual entry; otherwise, it's from web form.
        #
        # CRM forms may submit from the logged-in UI but still fail cookie auth in some
        # deployments, so we also accept an explicit override from the frontend.
        source = 'MANUAL' if request.user.is_authenticated else 'WEB'
        source_override = _safe_get_text(data, "source_override", "").upper()
        if source_override in {"MANUAL", "WEB"}:
            source = source_override
        
        # Create ticket
        ticket = Ticket.objects.create(
            client=client,
            ticket_type='NEW',
            status='LEAD',
            priority='MEDIUM',
            insurance_type=insurance_type or 'Auto Insurance',
            details=details_dict,
            additional_notes=additional_details,
            source=source
        )
        
        return Response({
            'success': True,
            'message': 'Insurance form submitted successfully',
            'ticket_no': ticket.ticket_no,
            'client_id': client.client_id,
            'client_created': created
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@ratelimit(key="ip", rate="10/m", method="POST", block=True)
@csrf_protect
@api_view(['POST'])
@permission_classes([AllowAny])
def submit_renewal_form(request):
    """
    Public endpoint: Renewal Request form.
    """
    # When data is a Django QueryDict we must toggle `_mutable` to update it.
    # For plain dict (e.g. JSON body), item assignment works without this.
    if hasattr(request.data, "_mutable"):
        request.data._mutable = True
    request.data["ticket_type"] = "RENEWAL"
    return submit_typed_form(request)


@ratelimit(key="ip", rate="10/m", method="POST", block=True)
@csrf_protect
@api_view(['POST'])
@permission_classes([AllowAny])
def submit_changes_form(request):
    """
    Public endpoint: Policy Change Request form.
    """
    if hasattr(request.data, "_mutable"):
        request.data._mutable = True
    request.data["ticket_type"] = "CHANGES"
    return submit_typed_form(request)


@ratelimit(key="ip", rate="10/m", method="POST", block=True)
@csrf_protect
@api_view(['POST'])
@permission_classes([AllowAny])
def submit_cancellation_form(request):
    """
    Public endpoint: Cancellation Request form.
    """
    if hasattr(request.data, "_mutable"):
        request.data._mutable = True
    request.data["ticket_type"] = "CANCELLATION"
    return submit_typed_form(request)


@ratelimit(key="ip", rate="10/m", method="POST", block=True)
@csrf_protect
@api_view(['POST'])
@permission_classes([AllowAny])
def submit_customer_issue_form(request):
    """
    Public endpoint: Customer Issue form.
    Uses CHANGES ticket_type but tags the details.
    """
    if hasattr(request.data, "_mutable"):
        request.data._mutable = True
    request.data["ticket_type"] = "CHANGES"
    request.data["additional_details"] = (
        _safe_get_text(request.data, "additional_details") + "\n[Form: Customer Issue]"
    ).strip()
    return submit_typed_form(request)


def submit_typed_form(request):
    """
    Shared handler for the typed forms above.
    Accepts same payload as submit_insurance_form plus 'ticket_type'.
    """
    try:
        data = request.data
        ticket_type = _safe_get_text(data, "ticket_type", "NEW") or "NEW"

        # Extract client info
        first_name = _safe_get_text(data, 'first_name')
        last_name = _safe_get_text(data, 'last_name')
        email = _safe_get_text(data, 'email').lower()
        phone = _safe_get_text(data, 'phone')
        occupation = _safe_get_text(data, 'occupation')

        # Address lines
        street_address = _safe_get_text(data, 'street_address')
        street_address_line_2 = _safe_get_text(data, 'street_address_line_2')
        city = _safe_get_text(data, 'city')
        state = _safe_get_text(data, 'state')
        postal_code = _safe_get_text(data, 'postal_code')

        address_parts = [p for p in [street_address, street_address_line_2, city, state, postal_code] if p]
        full_address = ', '.join(address_parts)

        # Basic validation
        if not first_name or not last_name or not email or not phone:
            return Response(
                {'error': 'First name, last name, email, and phone are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        client, created = Client.objects.get_or_create(
            email=email,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'phone': phone,
                'occupation': occupation,
                'address': full_address,
            }
        )
        if not created:
            client.first_name = first_name
            client.last_name = last_name
            client.phone = phone
            client.occupation = occupation or client.occupation
            if full_address:
                client.address = full_address
            client.save()

        # Common form fields
        insurance_type = _safe_get_text(data, 'insurance_type') or 'General'
        additional_details = _safe_get_text(data, 'additional_details')

        # Aggregate all unknown fields for traceability (keeps "same as JotForm" flexibility)
        passthrough_keys = sorted(k for k in data.keys() if k not in {
            'first_name', 'last_name', 'email', 'phone',
            'street_address', 'street_address_line_2', 'city', 'state', 'postal_code',
            'address', 'occupation',
            'ticket_type', 'insurance_type', 'additional_details'
        })
        
        details_dict = {}
        if insurance_type:
            details_dict["Insurance Type"] = insurance_type
        for k in passthrough_keys:
            details_dict[k] = _safe_get_text(data, k)

        # Determine source based on authentication; allow `source_override` hint from frontend.
        source = 'MANUAL' if request.user.is_authenticated else 'WEB'
        source_override = _safe_get_text(data, "source_override", "").upper()
        if source_override in {"MANUAL", "WEB"}:
            source = source_override

        initial_status = 'LEAD'
        if ticket_type == 'RENEWAL':
            initial_status = 'RENEWAL'
        elif ticket_type == 'CHANGES':
            initial_status = 'CHANGES'
        elif ticket_type == 'CANCELLATION':
            initial_status = 'DISCARDED'

        renewal_date_raw = _safe_get_text(data, "renewal_date")
        renewal_date = parse_date(renewal_date_raw) if renewal_date_raw else None

        ticket = Ticket.objects.create(
            client=client,
            ticket_type=ticket_type,
            status=initial_status,
            priority='MEDIUM',
            insurance_type=insurance_type,
            details=details_dict,
            additional_notes=additional_details,
            source=source,
            renewal_date=renewal_date,
        )

        return Response({
            'success': True,
            'message': f'{ticket_type} form submitted successfully',
            'ticket_no': ticket.ticket_no,
            'client_id': client.client_id,
            'client_created': created
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )