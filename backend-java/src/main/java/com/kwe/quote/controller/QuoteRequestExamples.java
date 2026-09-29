package com.kwe.quote.controller;

/** Request bodies shown in Swagger UI. Both are valid and can be sent as they are. */
final class QuoteRequestExamples {

    private QuoteRequestExamples() {
    }

    static final String FULL = """
            {
              "mode": "TPMA",
              "cargoType": "CGTPNP",
              "ratingType": "RTTPU",
              "pickupType": "PDTDO",
              "originPortCode": "ORD",
              "pickupAddress1": "100 N Riverside Plaza",
              "pickupAddress2": "Suite 1200",
              "pickupCity": "Chicago",
              "pickupState": "IL",
              "pickupPostalCode": "60606",
              "pickupCountryCode": "US",
              "deliveryType": "PDTPO",
              "destinationPortCode": "TPE",
              "deliveryCountryCode": "TW",
              "weightUom": "WUMKG",
              "dimensionUom": "DUMCM",
              "totalGrossWeight": 480.5,
              "totalGrossWeightUom": "WUMKG",
              "totalVolume": 3.2,
              "totalVolumeUom": "VUMCBM",
              "totalVolumeWeight": 534.4,
              "totalVolumeWeightUom": "WUMKG",
              "totalChargeableWeight": 534.4,
              "totalChargeableWeightUom": "WUMKG",
              "cargoReadyDate": "2026-09-20T00:00:00",
              "cargoReadyTz": "GMT",
              "cargoReadyTzStd": "Etc/GMT",
              "requiredDeliveryDate": "2026-09-27T00:00:00",
              "requiredDeliveryTz": "GMT",
              "requiredDeliveryTzStd": "Etc/GMT",
              "fullName": "Balaram Reddy",
              "companyName": "Acme Imports LLC",
              "isCommercialCustomer": true,
              "email": "balaram@example.com",
              "isConsentEmail": true,
              "phone": "+1-312-555-0199",
              "jobTitle": "Logistics Manager",
              "address": "100 N Riverside Plaza, Chicago, IL 60606",
              "countryCode": "US",
              "lineItems": [
                {
                  "commodity": "Electronic components",
                  "quantity": 20,
                  "packageType": "PKTBOX",
                  "grossWeight": 300.0,
                  "grossWeightUom": "WUMKG",
                  "volume": 1.9,
                  "volumeUom": "VUMCBM",
                  "volumeWeight": 317.3,
                  "volumeWeightUom": "WUMKG",
                  "chargeableWeight": 317.3,
                  "chargeableWeightUom": "WUMKG",
                  "length": 120.0,
                  "width": 80.0,
                  "height": 100.0,
                  "dimensionUom": "DUMCM",
                  "isStackable": true,
                  "isHazmat": false
                },
                {
                  "commodity": "Cables and adapters",
                  "quantity": 10,
                  "packageType": "PKTCRT",
                  "grossWeight": 180.5,
                  "grossWeightUom": "WUMKG",
                  "length": 110.0,
                  "width": 75.0,
                  "height": 95.0,
                  "dimensionUom": "DUMCM"
                }
              ],
              "accessorialServices": ["ACSOCC", "ACSDCC", "ACSINS"]
            }""";

    static final String MINIMAL = """
            {
              "mode": "TPMA",
              "cargoType": "CGTPNP",
              "ratingType": "RTTPU",
              "pickupType": "PDTPO",
              "originPortCode": "ORD",
              "deliveryType": "PDTPO",
              "destinationPortCode": "TPE",
              "weightUom": "WUMKG",
              "dimensionUom": "DUMCM",
              "fullName": "Balaram Reddy",
              "companyName": "Acme Imports LLC",
              "isCommercialCustomer": true,
              "email": "balaram@example.com",
              "isConsentEmail": true,
              "lineItems": [
                { "commodity": "Electronic components", "quantity": 20 }
              ]
            }""";
}
