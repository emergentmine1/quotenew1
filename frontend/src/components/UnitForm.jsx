import { Plus, Trash2, Boxes, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CalculationToggle from '@/components/CalculationToggle';
import { RATING_PER_UNIT } from '@/lib/quote-codes';
import { MAX_NUMBER } from '@/lib/field-limits';
import { cn } from '@/lib/utils';

function UnitToggle({ value, onChange, options, testId }) {
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-0.5" data-testid={testId}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-bold transition-all',
            value === option ? 'bg-white text-[#0B2545] shadow-sm' : 'text-slate-500'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function NumericField({ label, value, onChange, testId }) {
  return (
    <div>
      <Label className="block text-xs font-semibold uppercase tracking-widest text-slate-600">{label}</Label>
      <Input
        data-testid={testId}
        type="number"
        min={0}
        max={MAX_NUMBER}
        value={value}
        onKeyDown={(e) => {
          if (e.key === "-") {
            e.preventDefault();
          }
        }}
        onChange={(event) => {
          const val = event.target.value;

          if (val === "") {
            onChange("");
            return;
          }

          onChange(Math.min(MAX_NUMBER, Math.max(0, Number(val))));
        }}
        className="mt-1.5 h-11 rounded-xl border-slate-200"
      />
    </div>
  );
}

function unitSubtotalCft(unit, dimUnit) {
  const factor = dimUnit === 'CM' ? 1 / 2.54 : 1;
  const l = Number(unit.length || 0) * factor;
  const w = Number(unit.width || 0) * factor;
  const h = Number(unit.height || 0) * factor;
  const units = Number(unit.units || 0);
  return ((l * w * h) / 1728) * units;
}

function unitSubtotalLb(unit, weightUnit) {
  const each = weightUnit === 'KG' ? Number(unit.weight || 0) / 0.453592 : Number(unit.weight || 0);
  return each * Number(unit.units || 0);
}

function unitGrossWeightKg(unit, weightUnit) {
  const eachKg = weightUnit === 'KG' ? Number(unit.weight || 0) : Number(unit.weight || 0) * 0.453592;
  return eachKg * Number(unit.units || 0);
}

function volumeWeightKgFromCft(cft) {
  // UI-aligned volumetric conversion for air quote preview.
  return Number(cft || 0) * 0.071;
}



export default function UnitForm({
  calcMode,
  onCalcModeChange,
  calculationMethods,
  dimUnit,
  weightUnit,
  onDimUnitChange,
  onWeightUnitChange,
  dimUnitOptions,
  weightUnitOptions,
  units,
  onUnitChange,
  onUnitRemove,
  onAddUnit,
  packageTypeOptions,
  totalShipment,
  onTotalShipmentChange,
  shipmentTotals,
  flags,
  setFlags,
}) {
  return (
    <div className="space-y-4">
      <CalculationToggle
        value={calcMode}
        options={calculationMethods}
        onChange={onCalcModeChange}
        testIdPrefix="iq-calc"
      />

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="font-semibold uppercase tracking-widest text-slate-500">Dimensions</span>
        <UnitToggle value={dimUnit} onChange={onDimUnitChange} options={dimUnitOptions} testId="iq-dim-unit" />
        <span className="ml-2 font-semibold uppercase tracking-widest text-slate-500">Weight</span>
        <UnitToggle value={weightUnit} onChange={onWeightUnitChange} options={weightUnitOptions} testId="iq-weight-unit" />
      </div>

      {calcMode === RATING_PER_UNIT ? (
        <div className="space-y-4">
          {units.map((unit, idx) => (
            <div key={unit.id} className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0B2545] text-xs font-bold text-white">{idx + 1}</div>
                  <span className="font-bold text-[#0B2545]">Unit {idx + 1}</span>
                </div>
                {units.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => onUnitRemove(unit.id)}
                    data-testid={`iq-remove-unit-${idx + 1}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                <div className="col-span-2 md:col-span-2">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">Package type*</Label>
                  <Select value={unit.packageType} onValueChange={(value) => onUnitChange(unit.id, { packageType: value })}>
                    <SelectTrigger className="mt-1.5 h-11 rounded-xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {packageTypeOptions.map((option) => (
                        <SelectItem key={option.code} value={option.code}>{option.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <NumericField label="# Units" value={unit.units} onChange={(value) => onUnitChange(unit.id, { units: value })} />
                <NumericField label={`L (${dimUnit})`} value={unit.length} onChange={(value) => onUnitChange(unit.id, { length: value })} />
                <NumericField label={`W (${dimUnit})`} value={unit.width} onChange={(value) => onUnitChange(unit.id, { width: value })} />
                <NumericField label={`H (${dimUnit})`} value={unit.height} onChange={(value) => onUnitChange(unit.id, { height: value })} />

                <div className="col-span-2 md:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                  <NumericField
                    label={`Weight per unit (${weightUnit})*`}
                    value={unit.weight}
                    onChange={(value) => onUnitChange(unit.id, { weight: value })}
                  />

                  <div>
                    <Label className="block text-xs font-semibold uppercase tracking-widest text-slate-600">Subtotal</Label>
                    <div className="mt-1.5 flex h-11 items-center gap-4 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-mono text-slate-700 overflow-x-auto">
                      {(() => {
                        const volCft = unitSubtotalCft(unit, dimUnit);
                        const gWtKg = unitGrossWeightKg(unit, weightUnit);
                        const volWtKg = volumeWeightKgFromCft(volCft);
                        const cWtKg = Math.max(gWtKg, volWtKg);
                        return (
                          <>
                            <span className="whitespace-nowrap">Vol <span className="font-bold text-[#0B2545]">{volCft.toFixed(0)} CFT</span></span>
                            <span className="whitespace-nowrap">G.Wt <span className="font-bold text-[#0B2545]">{gWtKg.toFixed(1)} KG</span></span>
                            <span className="whitespace-nowrap">Vol Wt <span className="font-bold text-[#0B2545]">{volWtKg.toFixed(1)} KG</span></span>
                            <span className="whitespace-nowrap">C.Wt <span className="font-bold text-[#0B2545]">{cWtKg.toFixed(1)} KG</span></span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-3">
                <Label className="text-sm font-semibold text-slate-700">Goods/Commodity*</Label>
                <Input
                  data-testid={`iq-unit-commodity-${idx + 1}`}
                  maxLength={80}
                  value={unit.commodity || ''}
                  onChange={(event) => onUnitChange(unit.id, { commodity: event.target.value })}
                  placeholder="e.g., 50 cartons of electronic components, palletized, non-hazardous cargo."
                  className="mt-1.5 h-11 rounded-xl border-slate-200"
                />
              </div>

              <CargoFlags
                flags={flags}
                setFlags={setFlags}
                hazardous={Boolean(unit.hazardous)}
                onHazardousChange={(value) => onUnitChange(unit.id, { hazardous: value })}
              />
            </div>
          ))}

          <button
            type="button"
            data-testid="iq-add-unit"
            onClick={onAddUnit}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#5BB3FF]/50 py-3 text-sm font-semibold text-[#1E6AE1] transition-colors hover:bg-[#EAF3FF]"
          >
            <Plus className="h-4 w-4" /> Add Another Unit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumericField
            label={`Total volume (${dimUnit === 'CM' ? 'CBM' : 'CFT'})*`}
            value={totalShipment.volume}
            onChange={(volume) => onTotalShipmentChange({ ...totalShipment, volume })}
            testId="iq-total-volume"
          />
          <NumericField
            label={`Total weight (${weightUnit})*`}
            value={totalShipment.weight}
            onChange={(weight) => onTotalShipmentChange({ ...totalShipment, weight })}
            testId="iq-total-weight"
          />
          <div className="md:col-span-2">
            <Label className="text-sm font-semibold text-slate-700">Goods/Commodity*</Label>
            <Input
              data-testid="iq-total-commodity"
              maxLength={80}
              value={totalShipment.commodity || ''}
              onChange={(event) => onTotalShipmentChange({ ...totalShipment, commodity: event.target.value })}
              placeholder="e.g., 50 cartons of electronic components, palletized, non-hazardous cargo."
              className="mt-1.5 h-11 rounded-xl border-slate-200"
            />
            <CargoFlags flags={flags} setFlags={setFlags} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#0B2545] p-4 text-white">
        <div className="text-sm font-semibold">Shipment Total</div>
        <div className="text-sm font-mono flex flex-wrap items-center gap-x-4 gap-y-1">
          {(() => {
            const gWtKg = Number(shipmentTotals.lb || 0) * 0.453592;
            const volWtKg = volumeWeightKgFromCft(shipmentTotals.cft || 0);
            const cWtKg = Math.max(gWtKg, volWtKg);
            return (
              <>
                <span className="whitespace-nowrap">Units: <span className="font-bold">{shipmentTotals.units}</span></span>
                <span className="whitespace-nowrap">Vol <span className="font-bold">{shipmentTotals.cft.toFixed(0)} CFT</span></span>
                <span className="whitespace-nowrap">G.Wt <span className="font-bold">{gWtKg.toFixed(1)} KG</span></span>
                <span className="whitespace-nowrap">Vol Wt <span className="font-bold">{volWtKg.toFixed(1)} KG</span></span>
                <span className="whitespace-nowrap">C.Wt <span className="font-bold">{cWtKg.toFixed(1)} KG</span></span>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function CargoFlags({ flags, setFlags, hazardous, onHazardousChange }) {
  const hazardousChecked = typeof onHazardousChange === 'function'
    ? Boolean(hazardous)
    : Boolean(flags.hazardous);

  const handleHazardousChange = (value) => {
    if (typeof onHazardousChange === 'function') {
      onHazardousChange(value);
      return;
    }
    setFlags((prev) => ({ ...prev, hazardous: value }));
  };

  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label
        className={cn(
          'p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-3',
          flags.stackable
            ? 'border-[#1E6AE1] bg-[#EAF3FF]/40 ring-1 ring-[#1E6AE1]/15'
            : 'border-slate-200 bg-white'
        )}
      >
        <div
          className={cn(
            'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
            flags.stackable ? 'bg-[#0B2545] text-[#5BB3FF]' : 'bg-slate-100 text-slate-600'
          )}
        >
          <Boxes className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[#0B2545] text-sm">Stackable</div>
          <div className="text-xs text-slate-500">Cargo may be stacked during transit.</div>
        </div>
        <Switch
          data-testid="svc-stackable"
          checked={Boolean(flags.stackable)}
          onCheckedChange={(value) => setFlags((prev) => ({ ...prev, stackable: value }))}
          className="mt-1"
        />
      </label>

      <label
        className={cn(
          'p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-3',
          hazardousChecked
            ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-400/15'
            : 'border-slate-200 bg-white'
        )}
      >
        <div
          className={cn(
            'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
            hazardousChecked ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600'
          )}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[#0B2545] text-sm">Hazardous</div>
          <div className="text-xs text-slate-500">Cargo contains dangerous goods.</div>
        </div>
        <Switch
          data-testid="svc-hazardous"
          checked={hazardousChecked}
          onCheckedChange={handleHazardousChange}
          className="mt-1"
        />
      </label>
    </div>
  );
}
