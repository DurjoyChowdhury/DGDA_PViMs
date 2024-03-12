import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { DatePipe, Location } from '@angular/common';
import { BaseComponent } from 'app/shared/base/base.component';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
  FormArray,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { PopupService } from 'app/shared/services/popup.service';
import { AccountService } from 'app/shared/services/account.service';
import { EventService } from 'app/shared/services/event.service';
import { MediaObserver, MediaChange } from '@angular/flex-layout';
import { Observable, Subscription, of } from 'rxjs';
// Depending on whether rollup is used, moment needs to be imported differently.
// Since Moment.js doesn't have a default export, we normally need to import using the `* as`
// syntax. However, rollup creates a synthetic default module and we thus need to import it using
// the `default as` syntax.
import * as _moment from 'moment';
import { egretAnimations } from 'app/shared/animations/egret-animations';
import { _routes } from 'app/config/routes';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { DatasetService } from 'app/shared/services/dataset.service';
import { distinctUntilChanged, finalize, map, startWith } from 'rxjs/operators';
import { DatasetCategoryViewModel } from 'app/shared/models/dataset/dataset-category-view.model';
import { DatasetElementSubViewModel } from 'app/shared/models/dataset/dataset-element-sub-view.model';
import { SpontaneousTablePopupComponent } from './spontaneous-table/spontaneous-table.popup.component';
import { v4 as uuidv4 } from 'uuid';
import { MatRadioChange } from '@angular/material/radio';
import { MatSelectChange } from '@angular/material/select';
import {
  MAT_MOMENT_DATE_FORMATS,
  MomentDateAdapter,
} from '@angular/material-moment-adapter';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { YellowCardData } from 'app/shared/models/dataset/YellowCardData';
import { string } from '../../../../../node_modules1/postcss-selector-parser/postcss-selector-parser';
import { el } from 'date-fns/locale';

const moment = _moment;

const INITIAL_NEW_SECTION = {
  brand: [''],
  genericName: [''],
  doseForm: [''],
  indication: [''],
  strengthAndFrequency: [''],
};
export function endDateValidator(control: AbstractControl): { [key: string]: boolean } | null {
  const startDate = control.get('suspectedEventStartDate')?.value;
  const endDate = control.get('suspectedEventStoppedDate')?.value;

  if (startDate && endDate && startDate > endDate) {
    return { 'invalidEndDate': true };
  }

  return null;
}

@Component({
  templateUrl: './spontaneous.component.html',
  styleUrls: ['./spontaneous.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: egretAnimations,
  providers: [
    // `MomentDateAdapter` and `MAT_MOMENT_DATE_FORMATS` can be automatically provided by importing
    // `MatMomentDateModule` in your applications root module. We provide it at the component level
    // here, due to limitations of our example generation script.
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
  ],
})
export class SpontaneousComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  public datasetId = 1;
  public datasetCategories: DatasetCategoryViewModel[] = [];

  public viewModelForm: FormGroup;
  public viewModelFormNew: FormGroup;
  public formArray: FormArray;
  protected genderValue: string;
  protected adverseEventTreatment: string;
  public currentDate: string;
  protected isAgeNotAvailable: boolean;
  protected typeOfEvents: string[];
  protected eventInformation: string[];
  protected relevantHistory: string[];
  protected outcomeOfAdverseEvent: string;

  public eventInformationList: { selectionKey: string; value: string }[];
  public divisionList: { selectedkey: string; selectedValue: string }[];
  public districtList: { selectedkey: string; selectedValue: string }[];
  public thanaList: { selectedkey: string; selectedValue: string }[];
  public genderList: { selectionKey: string; value: string }[];
  public typeOfEventList: { selectionKey: string; value: string }[];
  public adverseEventTreatedList: { selectionKey: string; value: string }[];
  public actionTakenAfterReactionList: { selectionKey: string; value: string }[];
  public pregnantList: { selectionKey: string; value: string }[];
  public didReactionSubsideList: { selectionKey: string; value: string }[];
  public didReactionAppearList: { selectionKey: string; value: string }[];
  public seriousnessAdverseList: { selectionKey: string; value: string }[];
  public outcomeAttributedList: { selectionKey: string; value: string }[];
  public otherRelevantHistoryList: { selectionKey: string; value: string }[];
  public sourceOfReportingList: { selectionKey: string; value: string }[];
  public reportingTypeList: { selectionKey: string; value: string }[];
  public occupationList: { selectionKey: string; value: string }[];
  public companyNameList: { id: number; name: string }[];
  public organaizationNameList: { id: number; name: string }[];

  protected isMedDateNotAvailable: string;
  protected isEventDateNotAvailable: string;
  protected medEndDateMin: any;
  protected eventEndDateMin: any;
  protected sourceOfReport: string;
  protected reportType: string;
  isMobileView: boolean;
  usaidLogo= '';
  pvims_logo='';
  filteredCompanyNames: Observable<{ id: number; name: string }[]>;
  // filteredOrganizationNames: Observable<any[]>;

  constructor(
    protected _activatedRoute: ActivatedRoute,
    protected _router: Router,
    protected _location: Location,
    protected _formBuilder: FormBuilder,
    protected popupService: PopupService,
    protected accountService: AccountService,
    protected eventService: EventService,
    protected datasetService: DatasetService,
    protected dialog: MatDialog,
    protected mediaObserver: MediaObserver,
    protected datePipe: DatePipe
  ) {
    super(_router, _location, popupService, accountService, eventService);

    this.flexMediaWatcher = mediaObserver.media$.subscribe(
      (change: MediaChange) => {
        if (change.mqAlias !== this.currentScreenWidth) {
          this.currentScreenWidth = change.mqAlias;
          //this.setupTable();
        }
      }
    );
    this.isMobileView = window.innerWidth < 768; 
    this.usaidLogo = 'assets/images/usaid_blue_hands.png';
    this.pvims_logo='assets/images/pvims_logo_sm.png';

   // this.filteredOrganizationNames =of(this._filterOrganization(''))
   
  }

  currentScreenWidth: string = '';
  flexMediaWatcher: Subscription;

  ngOnInit(): void {
    const self = this;
    const today = moment().format('DD-MM-YYYY');

    self.viewModelForm = this._formBuilder.group({
      formArray: this._formBuilder.array([]),
    });



    self.loadDataset();
    self.loadDivisions();

    self.adverseEventTreatment = 'Yes';
    self.currentDate = today;
    self.isAgeNotAvailable = true;
    self.typeOfEvents = [];
    self.eventInformation = [];
    self.relevantHistory = [];
    self.divisionList = [];
    self.districtList = [];
    self.thanaList = [];
    self.isMedDateNotAvailable = 'Yes';
    self.isEventDateNotAvailable = 'Yes';
    self.medEndDateMin = '';

    this.viewModelFormNew = this._formBuilder.group({

      //sections: this._formBuilder.array([this._formBuilder.group({...INITIAL_NEW_SECTION})]),
      sections: this._formBuilder.array([]),

      aefiType:'',
      patientName:'',
      patientPhoneNumber:'',
      patientWeight:'',
      isChecked: false,
      patientAgeYear:[null, []],
      patientAgeMonth:[null, []],
      patientAgeDays:[null, []],
      patientGender:'',
      patientPregnantStatus:'',
      patientDivision:'',
      patientDistrict:'',
      patientUpazila:'',
      patientAddress:'',

      suspectedType:'',
      suspectedTypeSpecify:{ disabled: true, value: '' },
      suspectedLaboratoryResults:'',
      suspectedEventStartDate: [null, []],
      suspectedEventStoppedDate:[null, []],
      isCheckedEventDate: false,
      isCheckedEventEndDate: false,
      suspectedEventTreated:'',
      suspectedEventTreatedSpecify:{ disabled: true, value: '' },
      suspectedAfterReaction:'',
      suspectedProduct:'',
      suspectedAppearAfter:'',
      suspectedAdverseEvent:'',
      suspectedIfSerious:'',
      suspectedAttributedEvent:'',
      suspectedDateOfDeath:{ disabled: true, value: '' },
      suspectedOtherRevevant:'',
      suspectedOtherRevevantSpecify:{ disabled: true, value: '' },
      suspectedEventInformation:new FormControl([]),
      suspectedEventInformationSpecify:{ disabled: true, value: '' },

      suspectedBrandTradeName:'',
      suspectedGenericName:'',
      suspectedIndication:'',
      suspectedMedicationStartDate:[null, []],
      suspectedMedicationEndDate:[null, []],
      isCheckedVaccination:false,
      isCheckedEndVaccination:false,
      suspectedDiluentInformation:'',
      suspectedEnterDoseForm:'',
      suspectedFrequencyDailyDose:'',
      suspectedBatchLotNumber:'',
      suspectedManufacturer:'',
      isCheckedConcomutant:false,


      reporterCompanyName:'',
      reporterOrganization:'',
      reporterIfOtherOrganization:'',
      reporterDateOfReportSubmission:{disabled: false, value: new Date()},
      reporterOccupation:'',
      reporterPhoneNumber:'',
      reporterEmailAddress:['',[Validators.email]],
      reporterAddress:'',
      reporterName:'',
      reporterInitialReportId:{ disabled: true, value: '' },
      reporterReportType:'',
      reporterSourceOfReporting:''

    });

    this.viewModelFormNew.get('isChecked').valueChanges.subscribe((isChecked) => {
      const patientAgeYearsControl = this.viewModelFormNew.get('patientAgeYear');
      const patientAgeMonthsControl = this.viewModelFormNew.get('patientAgeMonth');
      const patientAgeDaysControl = this.viewModelFormNew.get('patientAgeDays');

      if (isChecked) {
        // If checkbox is checked, disable and clear validation
        patientAgeYearsControl.disable();
        patientAgeMonthsControl.disable();
        patientAgeDaysControl.disable();

        patientAgeYearsControl.clearValidators();
        patientAgeMonthsControl.clearValidators();
        patientAgeDaysControl.clearValidators();
      } else {
        // If checkbox is unchecked, enable and set required validation
        patientAgeYearsControl.enable();
        patientAgeMonthsControl.enable();
        patientAgeDaysControl.enable();

         patientAgeYearsControl.setValidators([Validators.required]);
        // patientAgeMonthsControl.setValidators([Validators.required]);
       // patientAgeDaysControl.setValidators([Validators.required]);
      }

      // Update the validation state
      patientAgeYearsControl.updateValueAndValidity();
      patientAgeMonthsControl.updateValueAndValidity();
      patientAgeDaysControl.updateValueAndValidity();
    });

    
    this.viewModelFormNew.get('suspectedType').valueChanges.subscribe((selectedValues) => {
      const specifyControl = this.viewModelFormNew.get('suspectedTypeSpecify');
    
      // Check if 'Others' is included in the selected values array
      const isOthersSelected = selectedValues.includes('Others');
    
      if (isOthersSelected) {
        specifyControl.enable(); // Enable the control
        specifyControl.setValidators([Validators.required]); // Add the required validator
      } else {
        specifyControl.disable(); // Disable the control
        specifyControl.clearValidators(); // Clear any validators
      }
    
      specifyControl.updateValueAndValidity(); // Update the control's validation state
    });

    this.viewModelFormNew.get('suspectedEventTreated').valueChanges.subscribe((value) => {
      const specifyControl = this.viewModelFormNew.get('suspectedEventTreatedSpecify');

      if (value === 'Yes') {
        specifyControl.enable(); // Enable the control
      } else {
        specifyControl.disable(); // Disable the control
      }
    });
    
    this.viewModelFormNew.get('suspectedOtherRevevant').valueChanges.subscribe((selectedValues) => {
      const specifyControl = this.viewModelFormNew.get('suspectedOtherRevevantSpecify');
    
      // Check if 'Others' is included in the selected values array
      const isOthersSelected = selectedValues.includes('Others (Please specify)');
    
      if (isOthersSelected) {
        specifyControl.enable(); // Enable the control
        specifyControl.setValidators([Validators.required]); // Add the required validator
      } else {
        specifyControl.disable(); // Disable the control
        specifyControl.clearValidators(); // Clear any validators
      }
    
      specifyControl.updateValueAndValidity(); // Update the control's validation state
    });

    this.viewModelFormNew.get('reporterReportType').valueChanges.subscribe((value) => {
      const specifyControl = this.viewModelFormNew.get('reporterInitialReportId');

      if (value === 'Follow-up report') {
        specifyControl.enable(); // Enable the control
      } else {
        specifyControl.disable(); // Disable the control
      }
    });

    this.viewModelFormNew.get('suspectedEventInformation').valueChanges.subscribe((selectedValues) => {
      const specifyControl = this.viewModelFormNew.get('suspectedEventInformationSpecify');
    
      // Check if 'Others' is included in the selected values array
      const isOthersSelected = selectedValues.includes('Others');
    
      if (isOthersSelected) {
        specifyControl.enable(); // Enable the control
        specifyControl.setValidators([Validators.required]); // Add the required validator
      } else {
        specifyControl.disable(); // Disable the control
        specifyControl.clearValidators(); // Clear any validators
      }
    
      specifyControl.updateValueAndValidity(); // Update the control's validation state
    });

    this.viewModelFormNew.get('isCheckedEventDate').valueChanges.subscribe((isChecked) => {
      const startDateControl = this.viewModelFormNew.get('suspectedEventStartDate');

      if (!isChecked) {
        // If checkbox is unchecked, set validators
        startDateControl.setValidators([Validators.required, this.validatesuspectedEventStartDate.bind(this)]);
      } else {
        // If checkbox is checked, clear validators
        startDateControl.clearValidators();
      }

      // Update the validity of the controls
      startDateControl.updateValueAndValidity();
    });

    this.viewModelFormNew.get('isCheckedEventEndDate').valueChanges.subscribe((isChecked) => {
      const endDateControl = this.viewModelFormNew.get('suspectedEventStoppedDate');

      if (!isChecked) {
        // If checkbox is unchecked, set validators
        endDateControl.setValidators([Validators.required, this.validatesuspectedEventStoppedDate.bind(this)]);
      } else {
        // If checkbox is checked, clear validators
        endDateControl.clearValidators();
      }

      // Update the validity of the controls
      endDateControl.updateValueAndValidity();
    });

    this.viewModelFormNew.get('isCheckedVaccination').valueChanges.subscribe((isChecked) => {
      const startDateControl = this.viewModelFormNew.get('suspectedMedicationStartDate');

      if (!isChecked) {
        // If checkbox is unchecked, set validators
        startDateControl.setValidators([Validators.required, this.validatesuspectedMedicationStartDate.bind(this)]);
      } else {
        // If checkbox is checked, clear validators
        startDateControl.clearValidators();
      }

      // Update the validity of the controls
      startDateControl.updateValueAndValidity();
    });

    this.viewModelFormNew.get('isCheckedEndVaccination').valueChanges.subscribe((isChecked) => {
      const endDateControl = this.viewModelFormNew.get('suspectedMedicationEndDate');

      if (!isChecked) {
        // If checkbox is unchecked, set validators
        endDateControl.setValidators([Validators.required, this.validatesuspectedMedicationEndDate.bind(this)]);
      } else {
        // If checkbox is checked, clear validators
        endDateControl.clearValidators();
      }

      // Update the validity of the controls
      endDateControl.updateValueAndValidity();
    });

    this.viewModelFormNew.get('reporterSourceOfReporting').valueChanges.subscribe(value => {
      if (value === 'Marketing authorization holder') {
        this.viewModelFormNew.get('reporterOrganization').disable();
        this.viewModelFormNew.get('reporterOrganization').clearValidators();
        this.viewModelFormNew.get('reporterCompanyName').enable();
        this.viewModelFormNew.get('reporterIfOtherOrganization').disable();
        this.viewModelFormNew.get('reporterIfOtherOrganization').clearValidators();
      } else {
        this.viewModelFormNew.get('reporterOrganization').enable();
        this.viewModelFormNew.get('reporterCompanyName').disable();
        if(this.viewModelFormNew.get('reporterOrganization').value.includes('Others')){
          this.viewModelFormNew.get('reporterIfOtherOrganization').enable();
        }
        else{
          this.viewModelFormNew.get('reporterIfOtherOrganization').disable();
        this.viewModelFormNew.get('reporterIfOtherOrganization').clearValidators();
        }
      }
    });

    this.filteredCompanyNames = this.viewModelFormNew.get('reporterCompanyName').valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value))
      );
    (this.viewModelFormNew.get('sections') as FormArray).push(this._formBuilder.group({...INITIAL_NEW_SECTION}));

  }

  ngAfterViewInit(): void {
    let self = this;
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
    this.eventService.removeAll(SpontaneousComponent.name);
  }

  loadDataset(): void {
    let self = this;
    self.setBusy(true);
    self.datasetService
      .getSpontaneousDataset()
      .pipe(finalize(() => self.setBusy(false)))
      .subscribe(
        result => {
          self.datasetCategories = result.datasetCategories;
          self.datasetId = result.id;

          //DC
          self.loadGender();
          self.loadTypeOfEvent();
          self.loadAdverseEventTreated();
          self.loadActionTakenAfterReaction();
          self.loadpregnantList();
          self.loaddidReactionSubside();
          self.loaddidReactionAppear();
          self.loadseriousnessAdverse();
          self.loadoutcomeAttributed();
          self.loadotherRelevantHistory();
          self.loadsourceOfReporting();
          self.loadreportingType();
          self.loadoccupation();
          self.loadcompanyName();
          self.loadOrganizationName();
          self.loadEventInformation();
          //DC
          //self.prepareFormArray();
          
        },
        error => {
          self.handleError(error, error.statusText);
        }
      );
  }

  loadDivisions(): void {
    let self = this;
    self.setBusy(true);
    self.datasetService
      .loadDivisions()
      .pipe(finalize(() => self.setBusy(false)))
      .subscribe(
        result => {
          self.divisionList = result;
        },
        error => {
          self.handleError(error, error.statusText);
        }
      );
  }

  loadDistricts(divisionId: string): void {
    let self = this;
    self.setBusy(true);
    self.datasetService
      .loadDistrict(divisionId)
      .pipe(finalize(() => self.setBusy(false)))
      .subscribe(
        result => {
          self.districtList = result;
        },
        error => {
          self.handleError(error, error.statusText);
        }
      );
  }

  loadThanas(districtId: string): void {
    let self = this;
    self.setBusy(true);
    self.datasetService
      .loadThana(districtId)
      .pipe(finalize(() => self.setBusy(false)))
      .subscribe(
        result => {
          self.thanaList = result;
        },
        error => {
          self.handleError(error, error.statusText);
        }
      );
  }

  generateColumnArray(elementSubs: DatasetElementSubViewModel[]): string[] {
    let displayColumns: string[] = [];
    if (elementSubs.length > 5) {
      displayColumns = elementSubs
        .slice(0, 5)
        .map(a => a.datasetElementSubName);
      displayColumns.push('actions');
    } else {
      displayColumns = elementSubs.map(a => a.datasetElementSubName);
      displayColumns.push('actions');
    }
    return displayColumns;
  }

  openPopup(
    arrayIndex: number,
    rowIndex: number,
    datasetElementId: number,
    datasetElementSubs: DatasetElementSubViewModel[],
    data: any = {},
    isNew?
  ) {
    let self = this;
    let title = isNew ? 'Add Record' : 'Update Record';
    let dialogRef: MatDialogRef<any> = self.dialog.open(
      SpontaneousTablePopupComponent,
      {
        width: '920px',
        disableClose: true,
        data: { title: title, datasetElementSubs, payload: data },
      }
    );
    dialogRef.afterClosed().subscribe(res => {
      if (!res) {
        // If user press cancel
        return;
      }
      // Get existing value for the table element
      let tableValue = self.getTableValueFromArray(arrayIndex);

      // Prepare existing array of table values
      let tableRowsArray: any[] = [];
      if (Object.values(tableValue)[0] != null) {
        tableRowsArray = Object.assign([], Object.values(tableValue)[0]);
      }

      if (isNew) {
        tableRowsArray.push(res.elements);
      } else {
        tableRowsArray[rowIndex] = res.elements;
      }
      self.setTableValueArray(arrayIndex, datasetElementId, tableRowsArray);
    });
  }

  removeRecord(
    arrayIndex: number,
    rowIndex: number,
    datasetElementId: number
  ): void {
    let self = this;

    // Get existing value for the table element
    let tableValue = self.getTableValueFromArray(arrayIndex);

    // Prepare existing array of table values
    let tableRowsArray: any[] = [];
    if (Object.values(tableValue)[0] != null) {
      tableRowsArray = Object.assign([], Object.values(tableValue)[0]);
    }

    tableRowsArray.splice(rowIndex, 1);
    self.setTableValueArray(arrayIndex, datasetElementId, tableRowsArray);
  }

  prevent(event) {
    event.preventDefault();
  }

  saveForm(): void {
    if (
      confirm(
        'The information provided here are true to the best of my knowledge'
      ) == true
    ) {
      let self = this;
      self.setBusy(true);

      let allModels: any[] = [];

      const arrayControl = <FormArray>this.viewModelForm.controls['formArray'];
      arrayControl.controls.forEach(formGroup => {
        allModels.push(formGroup.value);
      });

      self.datasetService
        .saveSpontaneousInstance(self.datasetId, allModels)
        .subscribe(
          result => {
            self.notify('Report created successfully', 'Spontaneous Report');
            self._router.navigate([_routes.public.submissionSuccess], {
              state: {
                serialId: result.patient_identifier,
                currentDate: result.report_date,
                reportId: result.report_id,
                workflowId: '4096D0A3-45F7-4702-BDA1-76AEDE41B986',
              },
            });
          },
          error => {
            self.handleError(error, 'Error saving spontaneous report');
          }
        );
    }
  }

  getTableDataSource(arrayIndex: number): any[] {
    let self = this;
    let tableValue = self.getTableValueFromArray(arrayIndex);

    // Prepare existing array of table values
    let tableRowsArray: any[] = [];
    if (Object.values(tableValue)[0] != null) {
      tableRowsArray = Object.assign([], Object.values(tableValue)[0]);
    }

    return tableRowsArray;
  }

  formatOutput(outputValue: string): string {
    if (moment.isMoment(outputValue)) {
      return this.datePipe.transform(outputValue, 'yyyy-MM-dd');
    }
    return outputValue;
  }

  onChangeDivision(event: MatSelectChange) {
    this.loadDistricts(event.value);
  }

  onChangeDistrict(event: MatSelectChange) {
    this.loadThanas(event.value);
  }

  onChangeGender(event: MatSelectChange): void {
    this.genderValue = event.value;
  }

  onChangeTypeOfEvent(event: MatSelectChange): void {
    this.typeOfEvents = event.value;
  }

  onChangeEventInformation(event: MatSelectChange): void {
    this.eventInformation = event.value;
  }

  onChangeRelevantHistory(event: MatSelectChange): void {
    this.relevantHistory = event.value;
  }

  onChangeAdverseEventTreatment(event: MatRadioChange): void {
    this.adverseEventTreatment = event.value;
  }

  onChangeOutcomeOfAdverseEvent(event: MatRadioChange): void {
    this.outcomeOfAdverseEvent = event.value;
  }

  medStartDateChange(event: MatDatepickerInputEvent<Date>): void {
    this.medEndDateMin = new Date(event.value.toISOString());
  }

  eventStartDateChange(event: MatDatepickerInputEvent<Date>): void {
    this.eventEndDateMin = new Date(event.value.toISOString());
  }

  onChangeSourceOfReporting(event: MatRadioChange): void {
    this.sourceOfReport = event.value;
  }

  onChangeReportType(event: MatRadioChange): void {
    this.reportType = event.value;
  }

  phoneNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      // const isPhoneValid =
      //   value.toString().match(/^(?:880)?((01|1)[1,3-9]\d{8})$/) !== null;
      const isPhoneValid = value.toString().match(/^[\d ()+-]+$/) !== null;

      return !isPhoneValid ? { invalidPhone: true } : null;
    };
  }
  emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      // const isPhoneValid =
      //   value.toString().match(/^(?:880)?((01|1)[1,3-9]\d{8})$/) !== null;
      const isEmailValid =
        value.toString().match('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$') !==
        null;

      return !isEmailValid ? { invalidEmail: true } : null;
    };
  }
  private prepareFormArray(): void {
    let self = this;
    self.datasetCategories.forEach((category, index) => {
      // add form group per category
      let newGroup = self.addGroupForCategory();
      let elements = newGroup.get('elements') as FormGroup;

      category.datasetElements.forEach(element => {
        // Add elements to form group
        let validators = [];
        if (element.required) {
          validators.push(Validators.required);
        }
        if (element.stringMaxLength != null) {
          validators.push(Validators.maxLength(element.stringMaxLength));
        }
        if (
          element.numericMinValue != null &&
          element.numericMaxValue != null
        ) {
          validators.push(Validators.max(element.numericMaxValue));
          validators.push(Validators.min(element.numericMinValue));
        }
        if (
          element.datasetElementId === 106 ||
          element.datasetElementId === 136
        ) {
          validators.push(this.phoneNumberValidator());
        }
        if (element.datasetElementId === 137) {
          validators.push(this.emailValidator());
        }
        elements.addControl(
          element.datasetElementId.toString(),
          new FormControl(null, validators)
        );
      });

      if (index === 0) {
        // Set AE Report number field
        const serialNumber = self.generateSerialId();
        elements.get('103').setValue(serialNumber);

        // Set Date received field
        elements.controls['104'].setValue(moment());

        // Pregnant field validation
        elements.get('110').valueChanges.subscribe(val => {
          if (val !== 'Female') {
            elements.controls['111'].clearValidators();
            elements.controls['111'].setValue(null);
          }
          elements.controls['111'].updateValueAndValidity();
        });

        /**
         * Age related fields' shenanigans
         */
        const $ageCheckBox = elements.get('307');
        const $ageYear = elements.get('107');
        const $ageMonth = elements.get('295');
        const $ageDay = elements.get('296');
        $ageYear.setValue(0);
        $ageMonth.setValue(0);
        $ageDay.setValue(0);
        $ageCheckBox.setValue(true);
        $ageCheckBox.valueChanges.subscribe(checked => {
          if (checked) {
            self.isAgeNotAvailable = true;
            $ageYear.setValue(0);
            $ageMonth.setValue(0);
            $ageDay.setValue(0);
            $ageYear.clearValidators();
            $ageMonth.clearValidators();
            $ageDay.clearValidators();
          } else {
            self.isAgeNotAvailable = false;
            $ageYear.setValidators(Validators.required);
            $ageYear.reset();
            $ageMonth.setValidators(Validators.required);
            $ageMonth.reset();
            $ageDay.setValidators(Validators.required);
            $ageDay.reset();
          }
          $ageYear.updateValueAndValidity();
          $ageMonth.updateValueAndValidity();
          $ageDay.updateValueAndValidity();
        });
      //}

      //if (index === 1) {
        const $adverseEventField = elements.get('125');
        const adverseEeventFieldValues = category.datasetElements.find(
          item => item.datasetElementId === 125
        ).selectionDataItems;
        const $actionTakenField = elements.get('127');
        const actionTakenFieldValues = category.datasetElements.find(
          item => item.datasetElementId === 127
        ).selectionDataItems;
        const $reactTionSubsideFiled = elements.get('128');
        const reactTionSubsideFiledValues = category.datasetElements.find(
          item => item.datasetElementId === 128
        ).selectionDataItems;
        const $reacttionAppearedField = elements.get('129');
        const reacttionAppearedFieldValues = category.datasetElements.find(
          item => item.datasetElementId === 128
        ).selectionDataItems;
        const $outcomesField = elements.get('131');
        const outcomesFieldValues = category.datasetElements.find(
          item => item.datasetElementId === 131
        ).selectionDataItems;
        const $medicationStartDateNotAvailable = elements.get('306');
        const $medicationStartDate = elements.get('116');
        const $medicationEndDate = elements.get('117');
        const $eventDateNotAvailable = elements.get('308');
        const $eventStartDate = elements.get('123');
        const $eventEndDate = elements.get('124');

        const radioButtonFields = [
          $actionTakenField,
          $reactTionSubsideFiled,
          $reacttionAppearedField,
        ];

        /**
         * Set radio button initial values
         * Though the UI shows the first value as selected
         * While submitting, we don't receive the value
         */
        $adverseEventField.setValue(adverseEeventFieldValues[0].selectionKey);
        $actionTakenField.setValue(actionTakenFieldValues[0].selectionKey);
        $reactTionSubsideFiled.setValue(
          reactTionSubsideFiledValues[0].selectionKey
        );
        $reacttionAppearedField.setValue(
          reacttionAppearedFieldValues[0].selectionKey
        );
        $outcomesField.setValue(outcomesFieldValues[0].selectionKey);

        // Set all radio buttons values when they are changed
        radioButtonFields.forEach(radioButton => {
          radioButton.valueChanges
            .pipe(distinctUntilChanged())
            .subscribe(val => radioButton.setValue(val));
        });

        // Handle $adverseEventField radio button change separately
        $adverseEventField.valueChanges
          .pipe(distinctUntilChanged())
          .subscribe(val => {
            $adverseEventField.setValue(val);
            // If yes, field validation
            if (val !== 'Yes') {
              elements.controls['126'].clearValidators();
              elements.controls['126'].setValue(null);
            }
            elements.controls['126'].updateValueAndValidity();
          });

        // Handle $outcomesField radio button change separately
        $outcomesField.valueChanges
          .pipe(distinctUntilChanged())
          .subscribe(val => {
            $outcomesField.setValue(val);
            // Date of death validation
            if (val !== 'Fatal') {
              elements.controls['156'].clearValidators();
              elements.controls['156'].setValue(null);
            }
            elements.controls['156'].updateValueAndValidity();
          });

        // If others, please specify validation
        elements
          .get('132')
          .valueChanges.pipe(distinctUntilChanged())
          .subscribe(val => {
            if (val[0] !== 'Others (Please specify)') {
              elements.controls['153'].clearValidators();
              elements.controls['153'].setValue(null);
            }
            elements.controls['153'].updateValueAndValidity();
          });

        // If others, please specify(type of event) validation
        elements
          .get('112')
          .valueChanges.pipe(distinctUntilChanged())
          .subscribe(val => {
            if (val[0] !== 'Others') {
              elements.controls['298'].clearValidators();
              elements.controls['298'].setValue(null);
            }
            elements.controls['298'].updateValueAndValidity();
          });

        // Event information (If others, please specify) validation
        elements
          .get('301')
          .valueChanges.pipe(distinctUntilChanged())
          .subscribe(val => {
            if (val[0] !== 'Others') {
              elements.controls['302'].clearValidators();
              elements.controls['302'].setValue(null);
            }
            elements.controls['302'].updateValueAndValidity();
          });

        // Medication start date
        $medicationStartDateNotAvailable.setValue(true);
        if (self.isMedDateNotAvailable === 'Yes') {
          $medicationStartDate.clearValidators();
        }
        $medicationStartDateNotAvailable.valueChanges
          .pipe(distinctUntilChanged())
          .subscribe(val => {
            if (val) {
              self.isMedDateNotAvailable = 'Yes';
              $medicationStartDate.clearValidators();
              $medicationEndDate.setValue(null);
              $medicationStartDate.setValue(null);
            } else {
              self.isMedDateNotAvailable = 'No';
              $medicationStartDate.setValidators(Validators.required);
            }

            $medicationStartDate.updateValueAndValidity();
          });

        // Event date
        $eventDateNotAvailable.setValue(true);
        if (self.isEventDateNotAvailable === 'Yes') {
          $eventStartDate.clearValidators();
          $eventEndDate.clearValidators();
        }
        $eventDateNotAvailable.valueChanges
          .pipe(distinctUntilChanged())
          .subscribe(val => {
            if (val) {
              self.isEventDateNotAvailable = 'Yes';
              $eventStartDate.clearValidators();
              $eventEndDate.setValue(null);
              $eventStartDate.setValue(null);
            } else {
              self.isEventDateNotAvailable = 'No';
              $eventStartDate.setValidators(Validators.required);
            }

            $eventStartDate.updateValueAndValidity();
            $eventEndDate.updateValueAndValidity();
          });
     // }

      //if (index === 3) {
        // Set report submission date
        elements.get('140').setValue(moment());

        const $sourceOfReportingRadioField = elements.get('300');
        const sourceOfReportingRadioFieldValues = category.datasetElements.find(
          item => item.datasetElementId === 300
        ).selectionDataItems;
        const $reportingTypeRadioField = elements.get('303');

        // Set initial value of "Enter source of reporting" field
        $sourceOfReportingRadioField.setValue(
          sourceOfReportingRadioFieldValues[0].selectionKey
        );

        $sourceOfReportingRadioField.valueChanges
          .pipe(distinctUntilChanged())
          .subscribe(val => {
            if (val !== 'Marketing authorization holder') {
              self.reportType = '';
              elements.get('304').setValue(null);
              elements.get('305').setValue(null);
              elements.get('305').clearValidators();
            }
            if (val === 'Marketing authorization holder') {
              //self.reportType = this.reportType;
              elements.get('152').setValue(null);
              elements.get('152').clearValidators();
              /*elements.get('303').updateValueAndValidity();*/
            }
            elements.get('152').updateValueAndValidity();
            elements.get('304').updateValueAndValidity();
            elements.get('305').updateValueAndValidity();
          });
      }
    });
  }

  private getTableValueFromArray(index: number): any {
    let self = this;

    const arrayControl = <FormArray>self.viewModelForm.controls['formArray'];
    let formGroup = arrayControl.controls[index] as FormGroup;
    let elements = formGroup.get('elements') as FormGroup;

    return elements.value;
  }

  private setTableValueArray(
    index: number,
    datasetElementId: number,
    value: any[]
  ): void {
    let self = this;

    const arrayControl = <FormArray>self.viewModelForm.controls['formArray'];
    let formGroup = arrayControl.controls[index] as FormGroup;
    let elements = formGroup.get('elements') as FormGroup;
    let control = elements.get(datasetElementId.toString()) as FormControl;
    if (control) {
      control.setValue(value);
    }
  }

  private addGroupForCategory(): FormGroup {
    const arrayControl = <FormArray>this.viewModelForm.controls['formArray'];
    let newGroup = this._formBuilder.group({
      elements: this._formBuilder.group([]),
    });
    arrayControl.push(newGroup);
    return newGroup;
  }

  private generateSerialId(): string {
    const year = moment().format('YYYY');
    //const uuid = uuidv()4();
    const result = moment(new Date()).format("MMDDHHmmss");
    const serial = `DGDA_BD_${year}_${result}`;
    return serial;
  }
  //DC
  isGeneralInstructionsOpen: boolean = false;
  isSubmitReportOpen: boolean = false;

  currentYear: number = new Date().getFullYear();
  typeOfEvent: string;
  advEventTreated: string;
  pregnantStatus: string;
  seriousnessAdverse: string;
  outcomeAttributed: string;
  otherRelevantHistory: string;
  sourceOfReporting: string;
  reportingType: string;
  
  
  toggleGeneralInstructions() {
    this.isGeneralInstructionsOpen = !this.isGeneralInstructionsOpen;
    // Close other accordions if needed
    //this.isSubmitReportOpen = true;
  }
  // toggleSubmitReport() {
  //   this.isSubmitReportOpen = !this.isSubmitReportOpen;
  //   // Close other accordions if needed
  //   this.isGeneralInstructionsOpen = true;
  // }
 

  submitReport(){
    if (this.viewModelFormNew.valid) 
    {
      if (
        confirm(
          'The information provided here are true to the best of my knowledge'
        ) == true
      ){
        let self = this;
      self.setBusy(true);
        let allModels: any[] = [];
  
        var porcessPatientInformationResult = this.porcessPatientInformation();
      allModels.push(porcessPatientInformationResult);
      var processSuspectedInformationResult = this.processSuspectedInformation();
      allModels.push(processSuspectedInformationResult);
      var processMedicineVaccineInformationResult = this.processMedicineVaccineInformation();
      allModels.push(processMedicineVaccineInformationResult);
      var processRepoterInformationResult = this.processRepoterInformation()
      allModels.push(processRepoterInformationResult);

      
     
      self.datasetService
          .saveSpontaneousInstance(self.datasetId, allModels)
          .subscribe(
            result => {
              self.notify('Report created successfully', 'Spontaneous Report');
              self._router.navigate([_routes.public.submissionSuccess], {
                state: {
                  serialId: result.patient_identifier,
                  currentDate: result.report_date,
                  reportId: result.report_id,
                  workflowId: '4096D0A3-45F7-4702-BDA1-76AEDE41B986',
                },
              });
             this.processExtrelnalApiCall(porcessPatientInformationResult,processSuspectedInformationResult,processMedicineVaccineInformationResult,processRepoterInformationResult,result.report_id);
            },
            error => {
              self.handleError(error, 'Error saving spontaneous report');
            }
          );
      }
    }
    
      
  }
  porcessPatientInformation(){
    const staticPatient = {
      elements: {
        "103": null,
        "104": null,
        "105": null,
        "106": null,
        "107": null,
        "109": null,
        "110": null,
        "111": null,
        "145": null,
        "148": null,
        "149": null,
        "150": null,
        "295": null,
        "296": null,
        "307": null,
      },
    };

    staticPatient.elements["103"] = this.generateSerialId(); 
    staticPatient.elements["104"] = moment(); 
    staticPatient.elements["105"] = this.viewModelFormNew.get('patientName').value!== "" ? this.viewModelFormNew.get('patientName').value : null; 
    staticPatient.elements["106"] = this.viewModelFormNew.get('patientPhoneNumber').value!== "" ? this.viewModelFormNew.get('patientPhoneNumber').value : null; 
    staticPatient.elements["109"] = this.viewModelFormNew.get('patientWeight').value!== "" ? this.viewModelFormNew.get('patientWeight').value : null; 
    staticPatient.elements["107"] = this.viewModelFormNew.get('patientAgeYear').value!== "" ? this.viewModelFormNew.get('patientAgeYear').value : 0; 
    staticPatient.elements["295"] = this.viewModelFormNew.get('patientAgeMonth').value!== "" ? this.viewModelFormNew.get('patientAgeMonth').value : 0; 
    staticPatient.elements["296"] = this.viewModelFormNew.get('patientAgeDays').value!== "" ? this.viewModelFormNew.get('patientAgeDays').value : 0;
    staticPatient.elements["110"] = this.viewModelFormNew.get('patientGender').value;
    staticPatient.elements["111"] = this.viewModelFormNew.get('patientPregnantStatus').value !== "" ? this.viewModelFormNew.get('patientPregnantStatus').value : null; 
    staticPatient.elements["148"] = this.viewModelFormNew.get('patientDivision').value!== "" ? this.viewModelFormNew.get('patientDivision').value : null;
    staticPatient.elements["149"] = this.viewModelFormNew.get('patientDistrict').value!== "" ? this.viewModelFormNew.get('patientDistrict').value : null; 
    staticPatient.elements["150"] = this.viewModelFormNew.get('patientUpazila').value!== "" ? this.viewModelFormNew.get('patientUpazila').value : null; 
    staticPatient.elements["145"] = this.viewModelFormNew.get('patientAddress').value!== "" ? this.viewModelFormNew.get('patientAddress').value : null; 
    staticPatient.elements["307"] = this.viewModelFormNew.get('isChecked').value; 

    return staticPatient;
  }

  processSuspectedInformation(){
    const staticPatient = {
      elements: {
        "112": [],
        "113": null,
        "114": null,
        "115": null,
        "116": null,
        "117": null,
        "118": null,
        "119": null,
        "120": null,
        "121": null,
        "122": null,
        "123": null,
        "124": null,
        "125": null,
        "126": null,
        "127": null,
        "128": null,
        "129": null,
        "130": [],
        "131": null,
        "132": [],
        "153": null,
        "156": null,
        "298": null,
        "299": null,
        "301": [],
        "302": null,
        "306": null,
        "308": null,
      },
    };
    staticPatient.elements["112"] = this.viewModelFormNew.get('suspectedType').value!== "" ? this.viewModelFormNew.get('suspectedType').value : null; 
    staticPatient.elements["298"] = this.viewModelFormNew.get('suspectedTypeSpecify').value!== "" ? this.viewModelFormNew.get('suspectedTypeSpecify').value : null; 
    staticPatient.elements["113"] = this.viewModelFormNew.get('suspectedBrandTradeName').value!== "" ? this.viewModelFormNew.get('suspectedBrandTradeName').value : null; 
    staticPatient.elements["114"] = this.viewModelFormNew.get('suspectedGenericName').value!== "" ? this.viewModelFormNew.get('suspectedGenericName').value : null; 
    staticPatient.elements["115"] = this.viewModelFormNew.get('suspectedIndication').value!== "" ? this.viewModelFormNew.get('suspectedIndication').value : null; 
    staticPatient.elements["116"] = this.viewModelFormNew.get('suspectedMedicationStartDate').value!== "" ? this.viewModelFormNew.get('suspectedMedicationStartDate').value : null; 
    staticPatient.elements["117"] = this.viewModelFormNew.get('suspectedMedicationEndDate').value!== "" ? this.viewModelFormNew.get('suspectedMedicationEndDate').value : null; 
    staticPatient.elements["306"] = this.viewModelFormNew.get('isCheckedVaccination').value; 
    staticPatient.elements["118"] = this.viewModelFormNew.get('suspectedEnterDoseForm').value!== "" ? this.viewModelFormNew.get('suspectedEnterDoseForm').value : null; 
    staticPatient.elements["119"] = this.viewModelFormNew.get('suspectedFrequencyDailyDose').value;
    staticPatient.elements["120"] = this.viewModelFormNew.get('suspectedBatchLotNumber').value!== "" ? this.viewModelFormNew.get('suspectedBatchLotNumber').value : null;
    staticPatient.elements["121"] = this.viewModelFormNew.get('suspectedManufacturer').value!== "" ? this.viewModelFormNew.get('suspectedManufacturer').value : null;
    staticPatient.elements["301"] = this.viewModelFormNew.get('suspectedEventInformation').value!== "" ? this.viewModelFormNew.get('suspectedEventInformation').value : null;
    staticPatient.elements["302"] = this.viewModelFormNew.get('suspectedEventInformationSpecify').value!== "" ? this.viewModelFormNew.get('suspectedEventInformationSpecify').value : null;
    staticPatient.elements["122"] = this.viewModelFormNew.get('suspectedLaboratoryResults').value!== "" ? this.viewModelFormNew.get('suspectedLaboratoryResults').value : null;
    staticPatient.elements["123"] = this.viewModelFormNew.get('suspectedEventStartDate').value!== "" ? this.viewModelFormNew.get('suspectedEventStartDate').value : null;
    staticPatient.elements["124"] = this.viewModelFormNew.get('suspectedEventStoppedDate').value!== "" ? this.viewModelFormNew.get('suspectedEventStoppedDate').value : null;
    staticPatient.elements["308"] = this.viewModelFormNew.get('isCheckedEventDate').value;
    staticPatient.elements["125"] = this.viewModelFormNew.get('suspectedEventTreated').value!== "" ? this.viewModelFormNew.get('suspectedEventTreated').value : null;
    staticPatient.elements["126"] = this.viewModelFormNew.get('suspectedEventTreatedSpecify').value!== "" ? this.viewModelFormNew.get('suspectedEventTreatedSpecify').value : null;
    staticPatient.elements["127"] = this.viewModelFormNew.get('suspectedAfterReaction').value!== "" ? this.viewModelFormNew.get('suspectedAfterReaction').value : null;
    staticPatient.elements["128"] = this.viewModelFormNew.get('suspectedProduct').value!== "" ? this.viewModelFormNew.get('suspectedProduct').value : null;
    staticPatient.elements["129"] = this.viewModelFormNew.get('suspectedAppearAfter').value!== "" ? this.viewModelFormNew.get('suspectedAppearAfter').value : null;
    if(this.viewModelFormNew.get('suspectedAdverseEvent').value =='Not Serious'){
      staticPatient.elements["130"] = this.viewModelFormNew.get('suspectedAdverseEvent').value!== "" ? this.viewModelFormNew.get('suspectedAdverseEvent').value : null;
    }
    else{
      staticPatient.elements["130"] = this.viewModelFormNew.get('suspectedIfSerious').value!== "" ? this.viewModelFormNew.get('suspectedIfSerious').value : null;
    }
    staticPatient.elements["131"] = this.viewModelFormNew.get('suspectedAttributedEvent').value!== "" ? this.viewModelFormNew.get('suspectedAttributedEvent').value : null;
    staticPatient.elements["156"] = this.viewModelFormNew.get('suspectedDateOfDeath').value!== "" ? this.viewModelFormNew.get('suspectedDateOfDeath').value : null;
    staticPatient.elements["132"] = this.viewModelFormNew.get('suspectedOtherRevevant').value!== "" ? this.viewModelFormNew.get('suspectedOtherRevevant').value : null;
    staticPatient.elements["153"] = this.viewModelFormNew.get('suspectedOtherRevevantSpecify').value!== "" ? this.viewModelFormNew.get('suspectedOtherRevevantSpecify').value : null;
    staticPatient.elements["299"] = this.viewModelFormNew.get('suspectedDiluentInformation').value!== "" ? this.viewModelFormNew.get('suspectedDiluentInformation').value : null;

    return staticPatient;
  }

  processMedicineVaccineInformation(){
    const staticPatient = {
      elements: {
        "134": [],
      },
    };
    
    // Assuming your form is named 'yourForm'
    const sectionsFormArray = this.viewModelFormNew.get('sections') as FormArray;
    
    // Loop through each section
    for (let i = 0; i < sectionsFormArray.length; i++) {
      const sectionGroup = sectionsFormArray.at(i) as FormGroup;
    
      // Access values of individual form controls within each section
      var brandValue = sectionGroup.get('brand').value;
      var genericNameValue = sectionGroup.get('genericName').value;
      var doseFormValue = sectionGroup.get('doseForm').value;
      var indicationValue = sectionGroup.get('indication').value;
      var strengthAndFrequencyValue = sectionGroup.get('strengthAndFrequency').value;
    
      // Push values into staticPatient.elements["134"]
      staticPatient.elements["134"].push({
        "1": brandValue,
        "2": genericNameValue,
        "3": doseFormValue,
        "4": indicationValue,
        "5": strengthAndFrequencyValue,
      });
    }
    
    return staticPatient;
    
  }
  processRepoterInformation(){
    const staticPatient = {
      elements: {
        "135": null,
        "136": null,
        "137": null,
        "138": null,
        "140": null,
        "151": null,
        "152": null,
        "300": null,
        "303": null,
        "304": null,
        "305": null,
      },
    };
    staticPatient.elements["300"] = this.viewModelFormNew.get('reporterSourceOfReporting').value!== "" ? this.viewModelFormNew.get('reporterSourceOfReporting').value : null; 
    staticPatient.elements["303"] = this.viewModelFormNew.get('reporterReportType').value!== "" ? this.viewModelFormNew.get('reporterReportType').value : null; 
    staticPatient.elements["304"] = this.viewModelFormNew.get('reporterInitialReportId').value!== "" ? this.viewModelFormNew.get('reporterInitialReportId').value : null; 
    staticPatient.elements["135"] = this.viewModelFormNew.get('reporterName').value!== "" ? this.viewModelFormNew.get('reporterName').value : null; 
    staticPatient.elements["136"] = this.viewModelFormNew.get('reporterPhoneNumber').value!== "" ? this.viewModelFormNew.get('reporterPhoneNumber').value : null; 
    staticPatient.elements["137"] = this.viewModelFormNew.get('reporterEmailAddress').value!== "" ? this.viewModelFormNew.get('reporterEmailAddress').value : null; 
    staticPatient.elements["138"] = this.viewModelFormNew.get('reporterOccupation').value!== "" ? this.viewModelFormNew.get('reporterOccupation').value : null; 
    staticPatient.elements["151"] = this.viewModelFormNew.get('reporterAddress').value!== "" ? this.viewModelFormNew.get('reporterAddress').value : null; 
    staticPatient.elements["152"] = this.viewModelFormNew.get('reporterOrganization').value!== "" ? this.viewModelFormNew.get('reporterOrganization').value : null; 
    staticPatient.elements["140"] = this.viewModelFormNew.get('reporterDateOfReportSubmission').value!== "" ? this.viewModelFormNew.get('reporterDateOfReportSubmission').value : null; 
    staticPatient.elements["305"] = this.viewModelFormNew.get('reporterCompanyName').value!== "" ? this.viewModelFormNew.get('reporterCompanyName').value : null;

    return staticPatient;
    
  }

  processExtrelnalApiCall(param1: any, param2: any, param3: any, param4: any,id: number){
   
    let selectedAEFIType = this.viewModelFormNew.get('aefiType').value;
    let companyOrganizationOther = this.viewModelFormNew.get('reporterIfOtherOrganization').value;
    let selectedKeyDivision = this.viewModelFormNew.get('patientDivision').value;
    let selectedKeyDistrict = this.viewModelFormNew.get('patientDistrict').value;
    let selectedKeyThana = this.viewModelFormNew.get('patientUpazila').value;
    let seriousStatusValue = "";
    let value= param4.elements["305"] || "";
    let companyOranizationValue = 0;
    if(value === ""){
      companyOranizationValue = param4.elements["152"];
    }
    else{
      companyOranizationValue = param4.elements["305"];
    }
    if(this.viewModelFormNew.get('suspectedAdverseEvent').value =='Not Serious'){
      seriousStatusValue="No";
    }
    else{
      seriousStatusValue="Yes";
    }

    const yellowCardMedicines = param3.elements["134"].map((medicine: any) => {
      return {
          "case_id": id,
          "brand_name": medicine["1"] || "", // Adjust these accordingly based on the structure of staticPatient
          "generic_name": medicine["2"] || "",
          "indication": medicine["4"] || "",
          "dose_form": medicine["3"] || "",
          "strength": medicine["5"] || ""// Adjust this according to your data
      };
  });


    var yellowCardData = {
      "YellowCard": {
        //"id": id,
        "case_id": param1.elements["103"] || "",
        "aefi_type": selectedAEFIType || "",
        "patient_name": param1.elements["105"] || "",
        "patient_phone": param1.elements["106"] ? param1.elements["106"].toString() : "",
        "weight": param1.elements["109"] || 0,
        "age_year": param1.elements["107"] || 0,
        "age_month": param1.elements["295"] || 0,
        "age_day": param1.elements["296"] || 0,
        "gender": param1.elements["110"] === "Male" ? 2 : 1,
        "pregnancy": param1.elements && param1.elements["111"] ? param1.elements["111"] : "",
        "patient_division_id": selectedKeyDivision ? (this.divisionList.find(division => division.selectedkey === selectedKeyDivision)?.selectedValue || "") : "",
    "patient_district_id": selectedKeyDistrict ? (this.districtList.find(district => district.selectedkey === selectedKeyDistrict)?.selectedValue || "") : "",
    "patient_upazila_id": selectedKeyThana ? (this.thanaList.find(thana => thana.selectedkey === selectedKeyThana)?.selectedValue || "") : "",
        "patient_union_id": "",
        "patient_address": param1.elements["145"] || "",
        "event_type_id": param2.elements && param2.elements["112"] ? param2.elements["112"] : [],
        "event_other": param2.elements && param2.elements["298"] ? param2.elements["298"] : "" , 
        "event_detail": param2.elements["122"] || "",
        "event_start": param2.elements["123"] ? param2.elements["123"].format('YYYY-MM-DD') : "",
        "event_end": param2.elements["124"] ? param2.elements["124"].format('YYYY-MM-DD') : "",
        "event_treated": param2.elements["125"] || 0,
        "event_treated_specify": param2.elements["126"] || "",
        "action_taken": param2.elements["127"] || "",
        "reaction_subside": param2.elements["128"] || "",
        "event_info": param2.elements && param2.elements["301"] ? param2.elements["301"] : [], //event information
        "event_info_other": param2.elements && param2.elements["302"] ? param2.elements["302"] : "" , //event information others
        "reaction_appear": param2.elements["129"] || "",
        "seriousness_status": seriousStatusValue,
        "seriousness_type": this.viewModelFormNew.get('suspectedIfSerious').value || [],
        "outcome": param2.elements && param2.elements["131"] ? param2.elements["131"] : "",
        "outcome_specify": param2.elements["156"] ? param2.elements["156"].format('YYYY-MM-DD') : "",
        "relevant_history": param2.elements && param2.elements["132"] ? param2.elements["132"] : [],
        "relevant_history_other": param2.elements && param2.elements["153"] ? param2.elements["153"] : "",
        "brand_name": param2.elements["113"] || "",
        "generic_name": param2.elements["114"] || "",
        "indication": param2.elements["115"] || "",
        "medication_start": param2.elements["116"] ? param2.elements["116"].format('YYYY-MM-DD') : "",
        "medication_end": param2.elements["117"] ? param2.elements["117"].format('YYYY-MM-DD') : "",
        "dose_form": param2.elements["118"] || "",
        "frequency": param2.elements["119"] || "",
        "batch_no": param2.elements["120"] || "",
        "manufacturer": param2.elements["121"] || "",
        "diluent_info": param2.elements["299"] || "",
        "reporting_source": param4.elements["300"] || "",
        "reporting_type": param2.elements && param2.elements["303"] ? param2.elements["303"] : "", 
        "initial_id": param2.elements && param2.elements["304"] ? param2.elements["304"] : "", 
        "reporter_name": param4.elements["135"] || "",
        "reporter_division_id": 0,
        "reporter_district_id": 0,
        "reporter_upazila_id": 0,
        "reporter_union_id": 0,
        "reporter_address": param4.elements["151"] || "",
        "reporter_email": param4.elements["137"] || "",
        "reporter_phone": param4.elements["136"] ? param4.elements["136"].toString() : "",
        "reporter_occupation": param4.elements["138"] || "",
        "submission_date": moment(param4.elements["140"]).format('YYYY-MM-DD') ||"",
        "company_name": companyOranizationValue,
        "company_other": companyOrganizationOther,
        "signature": ""
      },
      "YellowCardMedicines": yellowCardMedicines,
      "YellowCardManagement": {
      "case_id":id,
      "completeness_status":0,
      "user_type":0, // source of reporting
      "platform":1,
      "classification":0,
      "adrm_user":0,
      "tsc_status":0,
      "tsc_user":0,
      "tsc_comment":"",
      "tsc_date":"",
      "adrac_status":0,
      "adrac_user":0,
      "adrac_comment":"",
      "adrac_date":null,
      "vigiflow_status":0
      }
    };
    this.datasetService.postData(yellowCardData).subscribe(
      response => {
        console.log('Response from server:', response);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  navigateLogInComponent() {
    // Navigate to the 'other' route, assuming you have defined this route in your routing configuration
    this._router.navigate(['/app-signin']);
  }
  navigateCancelComponent(): void {
    this._router.navigate([_routes.security.landing]);
  }
  loadGender(): void{
    if(this.datasetCategories !== null){
     this.genderList = this.datasetCategories[0].datasetElements[13].selectionDataItems;
    }
  }
  loadTypeOfEvent(): void{
    if(this.datasetCategories !== null){
      this.typeOfEventList = this.datasetCategories[1].datasetElements[0].selectionDataItems;
     }
  }
  loadAdverseEventTreated(): void{
    if(this.datasetCategories !== null){
      this.adverseEventTreatedList = this.datasetCategories[1].datasetElements[18].selectionDataItems;
     }
  }
  loadActionTakenAfterReaction(): void{
    if(this.datasetCategories !== null){
      this.actionTakenAfterReactionList = this.datasetCategories[1].datasetElements[20].selectionDataItems;
     }
  }
  loadpregnantList(): void{
    if(this.datasetCategories !== null){
      this.pregnantList = this.datasetCategories[0].datasetElements[14].selectionDataItems;
     }
  }
  loaddidReactionSubside(): void{
    if(this.datasetCategories !== null){
      this.didReactionSubsideList = this.datasetCategories[1].datasetElements[21].selectionDataItems;
     }
  }
  loaddidReactionAppear(): void{
    if(this.datasetCategories !== null){
      this.didReactionAppearList = this.datasetCategories[1].datasetElements[22].selectionDataItems;
     }
  }
  loadseriousnessAdverse(): void{
    if(this.datasetCategories !== null){
      this.seriousnessAdverseList = this.datasetCategories[1].datasetElements[23].selectionDataItems;
     }
     if (this.seriousnessAdverseList.length > 0) {
      // Remove the first element from the array
      this.seriousnessAdverseList.shift();
    }
  }
  loadoutcomeAttributed(): void{
    if(this.datasetCategories !== null){
      this.outcomeAttributedList = this.datasetCategories[1].datasetElements[24].selectionDataItems;
     }
  }
  loadotherRelevantHistory(): void{
    if(this.datasetCategories !== null){
      this.otherRelevantHistoryList = this.datasetCategories[1].datasetElements[26].selectionDataItems;
     }
  }
  loadsourceOfReporting(): void{
    if(this.datasetCategories !== null){
      this.sourceOfReportingList = this.datasetCategories[3].datasetElements[0].selectionDataItems;
     }
  }
  loadreportingType(): void{
    if(this.datasetCategories !== null){
      this.reportingTypeList = this.datasetCategories[3].datasetElements[1].selectionDataItems;
     }
  }
  loadEventInformation():void{
    if(this.datasetCategories !==null){
      this.eventInformationList = this.datasetCategories[1].datasetElements[12].selectionDataItems;
    }
  }
  loadoccupation(): void{
    if(this.datasetCategories !== null){
      this.occupationList = this.datasetCategories[3].datasetElements[6].selectionDataItems;
     }
  }
  loadcompanyName(): void{
    // if(this.datasetCategories !== null){
    //   this.companyNameList = this.datasetCategories[3].datasetElements[9].selectionDataItems;
    //  }
    this.datasetService.getCompanyList()
      .subscribe(
        response => {
          this.companyNameList = response;
        },
        error => {
          console.error('Error fetching organization names:', error);
        }
      );
  }
  loadOrganizationName():void{
    // if(this.datasetCategories !== null){
    //   this.organaizationNameList = this.datasetCategories[3].datasetElements[8].selectionDataItems;
    //  }
    this.datasetService.getOrganizationList()
      .subscribe(
        response => {
          this.organaizationNameList = response;
        },
        error => {
          console.error('Error fetching organization names:', error);
        }
      );
  }
  
  
  get sectionsFormArray() {
    return this.viewModelFormNew.get('sections') as FormArray;
  }
  addFormSectionNew() {
    const newSection = this._formBuilder.group({...INITIAL_NEW_SECTION});
    this.sectionsFormArray.push(newSection);
  }
  removeFormSectionNew(index: number) {
    this.sectionsFormArray.removeAt(index);
  }
  isCheckedConcomutantEvent(){
    if(!this.viewModelFormNew.get('isCheckedConcomutant').value){
      const sectionsFormArray = this.viewModelFormNew.get('sections') as FormArray;
      for (let i = 0; i < sectionsFormArray.length; i++) {
        var a = sectionsFormArray.length;
        this.sectionsFormArray.removeAt(i);
      }
    }
    else{
      (this.viewModelFormNew.get('sections') as FormArray).push(this._formBuilder.group({...INITIAL_NEW_SECTION}));
    }
  }
 
  private validatesuspectedEventStartDate(control: AbstractControl): { [key: string]: boolean } | null {
    const startDate = control.value;
    const endDate = this.viewModelFormNew?.get('suspectedEventStoppedDate')?.value;

    if (startDate && endDate && startDate > endDate) {
      return { 'invalidStartDate': true };
    }

    return null;
  }
  private validatesuspectedEventStoppedDate(control: AbstractControl): { [key: string]: boolean } | null {
    const endDate = control.value;
    const startDate = this.viewModelFormNew?.get('suspectedEventStartDate')?.value;

    if (endDate && startDate && endDate < startDate) {
      return { 'invalidEndDate': true };
    }

    return null;
  }
  private validatesuspectedMedicationStartDate(control: AbstractControl): { [key: string]: boolean } | null {
    const startDate = control.value;
    const endDate = this.viewModelFormNew?.get('suspectedMedicationEndDate')?.value;

    if (startDate && endDate && startDate > endDate) {
      return { 'invalidStartDate': true };
    }

    return null;
  }
  private validatesuspectedMedicationEndDate(control: AbstractControl): { [key: string]: boolean } | null {
    const endDate = control.value;
    const startDate = this.viewModelFormNew?.get('suspectedMedicationStartDate')?.value;

    if (endDate && startDate && endDate < startDate) {
      return { 'invalidEndDate': true };
    }

    return null;
  }
  getMinEventStoppedDate(): Date | null {
    const startDate = this.viewModelFormNew.get('suspectedEventStartDate').value;
  
    // Return null if startDate is not selected or if isCheckedEventDate is true
    if (!startDate || this.viewModelFormNew.get('isCheckedEventDate').value) {
      return null;
    }
  
    // Return startDate to set it as the minimum date for suspectedEventStoppedDate
    return startDate;
  }
  getMinvaccinationEndDate(): Date | null {
    const startDate = this.viewModelFormNew.get('suspectedMedicationStartDate').value;
  
    // Return null if startDate is not selected or if isCheckedVaccination is true
    if (!startDate || this.viewModelFormNew.get('isCheckedVaccination').value) {
      return null;
    }
  
    // Return startDate to set it as the minimum date for suspectedMedicationEndDate
    return startDate;
  }
  private _filter(value: string):{ id: number; name: string }[] {
    const filterValue = value.toLowerCase();

    return this.companyNameList.filter(cmp => cmp.name.toLowerCase().includes(filterValue));
  }
  // private _filterOrganization(value: string):{ selectionKey: string; value: string }[] {
  //   const filterValue = value.toLowerCase();
  //   console.log(this.organaizationNameList.length);
  //   return this.organaizationNameList.filter(cmp => cmp.value.toLowerCase().includes(filterValue));
  // }
  clearInitialReportId() {
    if (this.viewModelFormNew.get('reporterReportType').value !== 'Follow-up report') {
        this.viewModelFormNew.get('reporterInitialReportId').reset();
    }
  }
  // isOthersSelected(): boolean {
  //   const selectedValue = this.viewModelFormNew.get('reporterOrganization').value;
  //   return Array.isArray(selectedValue) && selectedValue.includes('Others');
  // }
  isOtherForCompanyOrganization():boolean{
    if(this.viewModelFormNew.get('reporterOrganization').value ==='Others (Facility)'){
      return true;
    }
    else if(this.viewModelFormNew.get('reporterCompanyName').value ==='Others (MAH)'){
      return true;
    }
    else{
      return false;
    }
  }
}
