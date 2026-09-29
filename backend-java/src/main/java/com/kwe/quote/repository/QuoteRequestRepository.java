package com.kwe.quote.repository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import com.kwe.quote.dto.QuoteRequestLineItem;
import com.kwe.quote.dto.QuoteRequestPayload;
import com.kwe.quote.jooq.tables.records.TxQuoteaccessorialservicesRecord;
import com.kwe.quote.jooq.tables.records.TxQuoterequestRecord;
import com.kwe.quote.jooq.tables.records.TxQuoterequestdetailsRecord;

import static com.kwe.quote.jooq.Sequences.TX_QUOTEREQUEST_SEQ;
import static com.kwe.quote.jooq.tables.TxQuoteaccessorialservices.TX_QUOTEACCESSORIALSERVICES;
import static com.kwe.quote.jooq.tables.TxQuoterequest.TX_QUOTEREQUEST;
import static com.kwe.quote.jooq.tables.TxQuoterequestdetails.TX_QUOTEREQUESTDETAILS;

/** Writes a quote request and its children. One save is four statements, whatever the line count. */
@Repository
public class QuoteRequestRepository {

    // No authentication yet, so rows are stamped with the service itself. cby is varchar(10).
    private static final String CREATED_BY = "api";
    private static final String TZ_SHORT = "GMT";
    private static final String TZ_IANA = "Etc/GMT";

    private final DSLContext dsl;

    public QuoteRequestRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    /** Taken before the insert because qrref is built from the qrid. */
    public long nextQuoteRequestId() {
        return dsl.nextval(TX_QUOTEREQUEST_SEQ);
    }

    public void insertHeader(long qrid, String qrref, String status, QuoteRequestPayload payload,
            LocalDateTime now) {

        TxQuoterequestRecord record = dsl.newRecord(TX_QUOTEREQUEST);
        record.setQrid(qrid);
        record.setQrref(qrref);
        record.setStatus(status);

        record.setMode(payload.mode());
        record.setCargotype(payload.cargoType());
        record.setRatingtype(payload.ratingType());

        record.setPkuptype(payload.pickupType());
        record.setPoloading(payload.originPortCode());
        record.setPkupaddress1(payload.pickupAddress1());
        record.setPkupaddress2(payload.pickupAddress2());
        record.setPkupcity(payload.pickupCity());
        record.setPkupstate(payload.pickupState());
        record.setPkuppostalcode(payload.pickupPostalCode());
        record.setPkupcountrycode(payload.pickupCountryCode());

        record.setDelitype(payload.deliveryType());
        record.setPounloading(payload.destinationPortCode());
        record.setDeliaddress1(payload.deliveryAddress1());
        record.setDeliaddress2(payload.deliveryAddress2());
        record.setDelicity(payload.deliveryCity());
        record.setDelistate(payload.deliveryState());
        record.setDelipostalcode(payload.deliveryPostalCode());
        record.setDelicountrycode(payload.deliveryCountryCode());

        record.setWeightuom(payload.weightUom());
        record.setDimensionuom(payload.dimensionUom());
        record.setTotalgrossweight(payload.totalGrossWeight());
        record.setTotalgrossweightuom(payload.totalGrossWeightUom());
        record.setTotalvolume(payload.totalVolume());
        record.setTotalvolumeuom(payload.totalVolumeUom());
        record.setTotalvolumeweight(payload.totalVolumeWeight());
        record.setTotalvolumeweightuom(payload.totalVolumeWeightUom());
        record.setTotalchargeableweight(payload.totalChargeableWeight());
        record.setTotalchargeableweightuom(payload.totalChargeableWeightUom());

        record.setCargoreadydate(payload.cargoReadyDate());
        record.setCargoreadytz(payload.cargoReadyTz());
        record.setCargoreadytzstd(payload.cargoReadyTzStd());
        record.setReqdelidate(payload.requiredDeliveryDate());
        record.setReqdelitz(payload.requiredDeliveryTz());
        record.setReqdelitzstd(payload.requiredDeliveryTzStd());

        record.setFullname(payload.fullName());
        record.setCompanyname(payload.companyName());
        record.setIscommercialcust(payload.isCommercialCustomer());
        record.setEmail(payload.email());
        record.setIsconsentemail(payload.isConsentEmail());
        record.setPhone(payload.phone());
        record.setJobtitle(payload.jobTitle());
        record.setAddress(payload.address());
        record.setCountrycode(payload.countryCode());

        record.setVersion(0);
        record.setCby(CREATED_BY);
        record.setCdate(now);
        record.setCtz(TZ_SHORT);
        record.setCtzstd(TZ_IANA);
        record.setMby(CREATED_BY);
        record.setMdate(now);
        record.setMtz(TZ_SHORT);
        record.setMtzstd(TZ_IANA);

        record.insert();
    }

    /** Line numbers come from the list order, starting at 1. */
    public void insertLineItems(long qrid, List<QuoteRequestLineItem> lineItems, LocalDateTime now) {
        if (lineItems.isEmpty()) {
            return;
        }

        List<TxQuoterequestdetailsRecord> records = new ArrayList<>();
        int lineNo = 1;
        for (QuoteRequestLineItem item : lineItems) {
            TxQuoterequestdetailsRecord record = dsl.newRecord(TX_QUOTEREQUESTDETAILS);
            record.setQrid(qrid);
            record.setLineno(lineNo);
            record.setCommodity(item.commodity());
            record.setQuantity(item.quantity());
            record.setPackagetype(item.packageType());

            record.setGrossweight(item.grossWeight());
            record.setGrossweightuom(item.grossWeightUom());
            record.setVolume(item.volume());
            record.setVolumeuom(item.volumeUom());
            record.setVolumeweight(item.volumeWeight());
            record.setVolumeweightuom(item.volumeWeightUom());
            record.setChargeableweight(item.chargeableWeight());
            record.setChargeableweightuom(item.chargeableWeightUom());

            record.setLength(item.length());
            record.setWidth(item.width());
            record.setHeight(item.height());
            record.setDimensionuom(item.dimensionUom());

            // Both columns are NOT NULL, so apply the defaults the table declares.
            record.setIsstackable(orDefault(item.isStackable(), true));
            record.setIshazmat(orDefault(item.isHazmat(), false));

            record.setVersion(0);
            record.setCby(CREATED_BY);
            record.setCdate(now);
            record.setCtz(TZ_SHORT);
            record.setCtzstd(TZ_IANA);
            record.setMby(CREATED_BY);
            record.setMdate(now);
            record.setMtz(TZ_SHORT);
            record.setMtzstd(TZ_IANA);

            records.add(record);
            lineNo = lineNo + 1;
        }

        dsl.batchInsert(records).execute();
    }

    /** Null and an empty list both mean no accessorial service was selected. */
    public void insertAccessorialServices(long qrid, List<String> serviceCodes, LocalDateTime now) {
        if (serviceCodes == null || serviceCodes.isEmpty()) {
            return;
        }

        List<TxQuoteaccessorialservicesRecord> records = new ArrayList<>();
        for (String serviceCode : serviceCodes) {
            TxQuoteaccessorialservicesRecord record = dsl.newRecord(TX_QUOTEACCESSORIALSERVICES);
            record.setQrid(qrid);
            record.setServicecode(serviceCode);

            record.setVersion(0);
            record.setCby(CREATED_BY);
            record.setCdate(now);
            record.setCtz(TZ_SHORT);
            record.setCtzstd(TZ_IANA);
            record.setMby(CREATED_BY);
            record.setMdate(now);
            record.setMtz(TZ_SHORT);
            record.setMtzstd(TZ_IANA);

            records.add(record);
        }

        dsl.batchInsert(records).execute();
    }

    private boolean orDefault(Boolean value, boolean fallback) {
        if (value == null) {
            return fallback;
        }
        return value;
    }
}
