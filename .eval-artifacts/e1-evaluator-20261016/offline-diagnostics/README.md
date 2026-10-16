# Superseded exploratory output

These 22 immutable diagnostics were produced at fd37fd5, with the empty
reviewer equivalence table. They are exposed development evidence, not a clean
baseline and not a human-label calibration result.

They exposed an evaluator defect: matching any `/reserve` substring falsely
classified Tabelog's public `/contents/reserve_date_status_list` GET as a
TableCheck reserve document in 12 runs. The independent basis is ADR-0035;
the paired regression and fix are in `../04-outcomes/source-path-followup/`.

Do not use those S0 flags as current product findings. Retain the files as
failure evidence; the final report points to corrected diagnostics. Human
labels were not read, and the missing reviewer labels/equivalences/rules still
block calibration.
