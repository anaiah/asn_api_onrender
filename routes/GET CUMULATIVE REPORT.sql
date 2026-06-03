SELECT 
    full_name,
    hubs_location,
    COUNT(*) AS total_claims,
    COALESCE(ROUND(SUM(amount), 2), 0) AS cumulative_amount
FROM asn_claims
GROUP BY full_name
HAVING cumulative_amount >= 10000
ORDER BY cumulative_amount DESC;

//===== with year
SELECT 
    full_name,
    hubs_location,
    transaction_year,
    COUNT(*) AS total_claims,
    COALESCE(ROUND(SUM(amount), 2), 0) AS cumulative_amount
FROM asn_claims
WHERE transaction_year = '2026'
GROUP BY full_name, transaction_year
HAVING cumulative_amount >= 10000
ORDER BY cumulative_amount DESC;
