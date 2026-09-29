// Input limits that match the database columns (tx_quoterequest, tx_quoterequestdetails),
// so a user can never type a value the backend has to reject.

export const MAX_LENGTH = {
  fullName: 120,
  companyName: 200,
  email: 254,
  phone: 40,
  jobTitle: 100,
  address: 200,
};

// numeric(12,4): at most 8 digits before the decimal point.
export const MAX_NUMBER = 99999999;
