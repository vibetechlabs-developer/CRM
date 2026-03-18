from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from clients.models import Client
from tickets.models import Ticket


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_insurance_form(request):
    """
    Public endpoint for insurance form submission.
    Creates or finds client and creates a ticket automatically.
    """
    try:
        data = request.data
        
        # Extract client information
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        email = data.get('email', '').strip().lower()
        phone = data.get('phone', '').strip()
        address = data.get('address', '').strip()
        street_address = data.get('street_address', '').strip()
        street_address_line_2 = data.get('street_address_line_2', '').strip()
        city = data.get('city', '').strip()
        state = data.get('state', '').strip()
        postal_code = data.get('postal_code', '').strip()
        
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
        
        # Validate required fields
        if not first_name or not last_name or not email or not phone:
            return Response(
                {'error': 'First name, last name, email, and phone are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find or create client
        client, created = Client.objects.get_or_create(
            email=email,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'phone': phone,
                'address': full_address,
            }
        )
        
        # Update client if it already exists
        if not created:
            client.first_name = first_name
            client.last_name = last_name
            client.phone = phone
            if full_address:
                client.address = full_address
            client.save()
        
        # Extract insurance form data
        insurance_type = data.get('insurance_type', '').strip()
        insurance_effective_date = data.get('insurance_effective_date')
        date_of_birth = data.get('date_of_birth')
        currently_insured = data.get('currently_insured', '').strip()
        additional_details = data.get('additional_details', '').strip()
        
        # Build ticket details
        details_parts = [
            f"Insurance Type: {insurance_type}",
            f"Currently Insured: {currently_insured}",
        ]
        
        if insurance_effective_date:
            details_parts.append(f"Insurance Effective Date: {insurance_effective_date}")
        if date_of_birth:
            details_parts.append(f"Date of Birth: {date_of_birth}")
        
        # Auto Insurance Fields
        if 'Auto' in insurance_type:
            number_of_drivers = data.get('number_of_drivers', '1')
            number_of_vehicles = data.get('number_of_vehicles', '1')
            driving_license_number = data.get('driving_license_number', '').strip()
            g1_date = data.get('g1_date')
            g2_date = data.get('g2_date')
            g_date = data.get('g_date')
            car_vin_number = data.get('car_vin_number', '').strip()
            one_way_km = data.get('one_way_km', '').strip()
            annual_km = data.get('annual_km', '').strip()
            at_fault_claim = data.get('at_fault_claim', '').strip()
            conviction = data.get('conviction', '').strip()
            
            details_parts.append("\n--- AUTO INSURANCE DETAILS ---")
            details_parts.append(f"Number of Drivers: {number_of_drivers}")
            details_parts.append(f"Number of Vehicles: {number_of_vehicles}")
            if driving_license_number:
                details_parts.append(f"Driving License Number: {driving_license_number}")
            if g1_date:
                details_parts.append(f"G1 Date: {g1_date}")
            if g2_date:
                details_parts.append(f"G2 Date: {g2_date}")
            if g_date:
                details_parts.append(f"G Date: {g_date}")
            if car_vin_number:
                details_parts.append(f"Car VIN/Model: {car_vin_number}")
            if one_way_km:
                details_parts.append(f"One Way KM: {one_way_km}")
            if annual_km:
                details_parts.append(f"Annual KM: {annual_km}")
            if at_fault_claim:
                details_parts.append(f"At Fault Claim (Last 6 years): {at_fault_claim}")
            if conviction:
                details_parts.append(f"Conviction (Last 3 years): {conviction}")
        
        # Home/Tenant Insurance Fields
        if 'Home' in insurance_type or 'Tenant' in insurance_type:
            property_address = data.get('property_address', '').strip()
            property_address_line_2 = data.get('property_address_line_2', '').strip()
            property_city = data.get('property_city', '').strip()
            property_state = data.get('property_state', '').strip()
            property_postal_code = data.get('property_postal_code', '').strip()
            property_type = data.get('property_type', '').strip()
            property_value = data.get('property_value', '').strip()
            year_built = data.get('year_built', '').strip()
            square_footage = data.get('square_footage', '').strip()
            home_claims_history = data.get('home_claims_history', '').strip()
            
            details_parts.append("\n--- HOME/TENANT INSURANCE DETAILS ---")
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
                details_parts.append(f"Property Address: {', '.join(property_addr_parts)}")
            if property_type:
                details_parts.append(f"Property Type: {property_type}")
            if property_value:
                details_parts.append(f"Property Value: ${property_value}")
            if year_built:
                details_parts.append(f"Year Built: {year_built}")
            if square_footage:
                details_parts.append(f"Square Footage: {square_footage}")
            if home_claims_history:
                details_parts.append(f"Claims History (Last 5 years): {home_claims_history}")
        
        # Rental Property Insurance Fields
        # Check for rental insurance (handles both "Only Rental property Insurance" and combined types)
        if 'Rental' in insurance_type:
            rental_property_address = data.get('rental_property_address', '').strip()
            rental_property_address_line_2 = data.get('rental_property_address_line_2', '').strip()
            rental_property_city = data.get('rental_property_city', '').strip()
            rental_property_state = data.get('rental_property_state', '').strip()
            rental_property_postal_code = data.get('rental_property_postal_code', '').strip()
            rental_property_type = data.get('rental_property_type', '').strip()
            number_of_units = data.get('number_of_units', '1')
            rental_property_value = data.get('rental_property_value', '').strip()
            rental_year_built = data.get('rental_year_built', '').strip()
            rental_income = data.get('rental_income', '').strip()
            
            details_parts.append("\n--- RENTAL PROPERTY INSURANCE DETAILS ---")
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
                details_parts.append(f"Rental Property Address: {', '.join(rental_addr_parts)}")
            if rental_property_type:
                details_parts.append(f"Rental Property Type: {rental_property_type}")
            if number_of_units:
                details_parts.append(f"Number of Units: {number_of_units}")
            if rental_property_value:
                details_parts.append(f"Rental Property Value: ${rental_property_value}")
            if rental_year_built:
                details_parts.append(f"Year Built: {rental_year_built}")
            if rental_income:
                details_parts.append(f"Monthly Rental Income: ${rental_income}")
            # Also check for square_footage if provided (shared field)
            square_footage = data.get('square_footage', '').strip()
            if square_footage:
                details_parts.append(f"Square Footage: {square_footage}")
        
        details = '\n'.join(details_parts)
        
        # Determine source based on authentication
        # If user is authenticated, it's a manual entry; otherwise, it's from web form
        source = 'MANUAL' if request.user.is_authenticated else 'WEB'
        
        # Create ticket
        ticket = Ticket.objects.create(
            client=client,
            ticket_type='NEW',
            status='LEAD',
            priority='MEDIUM',
            insurance_type=insurance_type or 'Auto Insurance',
            details=details,
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
