# Subscription configuration

SUBSCRIPTION_PLANS = {
    "psychologist": {
        "name": "Psychologist Plan",
        "price": 25.00,
        "currency": "aud",
        "interval": "month",
        "features": [
            "Practice logbook tracking",
            "CPD activity logging",
            "Learning plans and goals",
            "Peer consultation tracking",
            "Competency journals",
            "Supervisor connections",
            "Messaging with supervisors"
        ]
    },
    "supervisor": {
        "name": "Supervisor Plan",
        "price": 50.00,
        "currency": "aud",
        "interval": "month",
        "features": [
            "View all connected psychologists",
            "Review logbooks and CPD activities",
            "Provide feedback on entries",
            "Monitor competency progress",
            "Messaging with psychologists",
            "Sign off weekly hours"
        ]
    }
}

# Promo codes
PROMO_CODES = {
    "BETA2024": {
        "discount_percent": 100,
        "description": "100% off for beta users",
        "max_uses": None,  # Unlimited
        "expires_at": None  # Never expires
    },
    "EARLYBIRD": {
        "discount_percent": 50,
        "description": "50% off for early adopters",
        "max_uses": 100,
        "expires_at": None
    }
}
