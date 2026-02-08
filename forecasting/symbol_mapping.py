# Symbol to ISIN mapping for BVMT stocks
# This maps the short symbols used by IlBoursa to the ISIN codes used in historical data files

SYMBOL_TO_ISIN = {
    # Banks
    "AB": "TN0006000014",  # Amen Bank
    "ATB": "TN0006010013",  # Arab Tunisian Bank
    "BIAT": "TN0006020012",  # Banque Internationale Arabe de Tunisie
    "BH": "TN0006030011",  # Banque de l'Habitat
    "BNA": "TN0006040010",  # Banque Nationale Agricole
    "BT": "TN0006050019",  # Banque de Tunisie
    "STB": "TN0006060018",  # Société Tunisienne de Banque
    "UIB": "TN0006070017",  # Union Internationale de Banques
    "UBCI": "TN0006080016",  # Union Bancaire pour le Commerce et l'Industrie
    "ATL": "TN0006090015",  # Attijari Leasing
    "BTE": "TN0006100012",  # Banque de Tunisie et des Emirats
    
    # Leasing & Financial Services
    "SIAME": "TN0006110011",  # SIAME
    "ATI": "TN0006120010",  # Arab Tunisian Lease
    "TLNET": "TN0006130019",  # Tunisie Leasing & Factoring
    "ESSOUKNA": "TN0006140018",  # Essoukna Takaful
    
    # Insurance
    "STAR": "TN0006150017",  # STAR
    "COMAR": "TN0006160016",  # COMAR
    "ASTREE": "TN0006170015",  # ASTREE
    "CARTE": "TN0006180014",  # CARTE
    "GAT": "TN0006190013",  # GAT Assurances
    "MAGHREBIA": "TN0006200018",  # Maghrebia
    "LLOYD": "TN0006210017",  # Lloyd Tunisien
    "SALIM": "TN0006220016",  # SALIM
    
    # Industry
    "ALKIMIA": "TN0001000108",  # Alkimia
    "ARTES": "TN0001100107",  # Artes
    "ASSAD": "TN0001200106",  # Assad
    "SITS": "TN0001300105",  # SITS
    "SIPHAT": "TN0001400104",  # SIPHAT
    "SOTETEL": "TN0001500103",  # SOTETEL
    "SOTUVER": "TN0001600102",  # SOTUVER
    "STIP": "TN0001700101",  # STIP
    "TPR": "TN0001800100",  # TPR
    "ELECTROSTAR": "TN0001900109",  # ELECTROSTAR
    
    # Services
    "SFBT": "TN0001100254",  # Société Frigorifique et Brasserie de Tunis
    "MONOPRIX": "TN0002100106",  # MONOPRIX
    "MAGASIN": "TN0002200105",  # Magasin Général
    "SIMPAR": "TN0002300104",  # SIMPAR
    "SOTUMAG": "TN0002400103",  # SOTUMAG
    "SOMOCER": "TN0002500102",  # SOMOCER
    "SOTRAPIL": "TN0002600101",  # SOTRAPIL
    "SOTEMAIL": "TN0002700100",  # SOTEMAIL
    
    # Real Estate
    "ESSOUKNA": "TN0003000105",  # Essoukna
    "SPDIT": "TN0003100104",  # SPDIT
    
    # Tourism & Leisure
    "HANNIBAL": "TN0004000104",  # Hannibal Lease
    "TAIR": "TN0004100103",  # Tunisair
    "SAH": "TN0004200102",  # Société Atelier du Habillement (Lilas)
    "SOTUHOTELS": "TN0004300101",  # SOTUHOTELS
    
    # Technology & Telecom
    "TELNET": "TN0005000103",  # TELNET
    "HEXABYTE": "TN0005100102",  # HEXABYTE
    "SERVICOM": "TN0005200101",  # SERVICOM
    
    # Agro-food
    "CEREALIS": "TN0006500015",  # CEREALIS
    "DELICE": "TN0006510014",  # DELICE Holding
    "LAND": "TN0006520013",  # LAND'OR
    "POULINA": "TN0006530012",  # Poulina Group Holding
    "SOPAT": "TN0006540011",  # SOPAT
    "STIA": "TN0006550010",  # STIA
    
    # Distribution
    "AMEN": "TN0006560019",  # Amen Project
    "CITY": "TN0006570018",  # City Cars
    "SOPAL": "TN0006580017",  # SOPAL
    "SOTIPAPIER": "TN0006590016",  # SOTIPAPIER
    "STEQ": "TN0006600015",  # STEQ
    "TUNINVEST": "TN0006610014",  # Tuninvest Finance Group
    
    # Common abbreviations that might be used
    "TT": "TN0001800457",  # Tunisie Telecom (most likely for "TT")
}

# Reverse mapping: ISIN to Symbol
ISIN_TO_SYMBOL = {v: k for k, v in SYMBOL_TO_ISIN.items()}

def get_isin_from_symbol(symbol: str) -> str:
    """Convert a symbol to its ISIN code. Returns the symbol itself if no mapping found."""
    return SYMBOL_TO_ISIN.get(symbol.upper(), symbol)

def get_symbol_from_isin(isin: str) -> str:
    """Convert an ISIN code to its symbol. Returns the ISIN itself if no mapping found."""
    return ISIN_TO_SYMBOL.get(isin.upper(), isin)
