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
import { Subscription } from 'rxjs';
// Depending on whether rollup is used, moment needs to be imported differently.
// Since Moment.js doesn't have a default export, we normally need to import using the `* as`
// syntax. However, rollup creates a synthetic default module and we thus need to import it using
// the `default as` syntax.
import * as _moment from 'moment';
import { egretAnimations } from 'app/shared/animations/egret-animations';
import { _routes } from 'app/config/routes';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { DatasetService } from 'app/shared/services/dataset.service';
import { distinctUntilChanged, finalize } from 'rxjs/operators';
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

const moment = _moment;

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
  public companyNameList: { selectionKey: string; value: string }[];

  protected isMedDateNotAvailable: string;
  protected isEventDateNotAvailable: string;
  protected medEndDateMin: any;
  protected eventEndDateMin: any;
  protected sourceOfReport: string;
  protected reportType: string;

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
      patientName:'',
      patientPhoneNumber:'',
      patientWeight:'',
      isChecked:'',
      patientAgeYear:'',
      patientAgeMonth:'',
      patientAgeDays:'',
      patientGender:'',
      patientPregnantStatus:'',
      patientDivision:'',
      patientDistrict:'',
      patientUpazila:'',
      patientAddress:'',

      suspectedType:'',
      suspectedTypeSpecify:'',
      suspectedLaboratoryResults:'',
      suspectedEventStartDate:'',
      suspectedEventStoppedDate:'',
      suspectedEventTreated:'',
      suspectedEventTreatedSpecify:'',
      suspectedAfterReaction:'',
      suspectedProduct:'',
      suspectedAppearAfter:'',
      suspectedAdverseEvent:'',
      suspectedIfSerious:'',
      suspectedAttributedEvent:'',
      suspectedDateOfDeath:'',
      suspectedOtherRevevant:'',
      suspectedOtherRevevantSpecify:'',

    });
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
          //DC
          self.prepareFormArray();
          
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
    const uuid = uuidv4();
    const serial = `DGDA_BD_${year}_${uuid}`;

    return serial;
  }
  //DC
  isGeneralInstructionsOpen: boolean = true;
  isSubmitReportOpen: boolean = false;
  formAddSections = [
    { field1: '', field2: '', field3: '',field4: '',field5: '' } // Initial set of fields
  ];
  currentYear: number = new Date().getFullYear();
  typeOfEvent: string;
  advEventTreated: string;
  pregnantStatus: string;
  seriousnessAdverse: string;
  outcomeAttributed: string;
  otherRelevantHistory: string;
  sourceOfReporting: string;
  reportingType: string;
  ageSelectionStatus : boolean = true;
  
  toggleGeneralInstructions() {
    this.isGeneralInstructionsOpen = !this.isGeneralInstructionsOpen;
    // Close other accordions if needed
    this.isSubmitReportOpen = true;
  }
  toggleSubmitReport() {
    this.isSubmitReportOpen = !this.isSubmitReportOpen;
    // Close other accordions if needed
    this.isGeneralInstructionsOpen = true;
  }
  addFormSection() {
    // Clone the first section and add it to the formSections array
    const newSection = Object.assign({}, this.formAddSections[0]);
    this.formAddSections.push(newSection);
  }

  removeFormSection(index: number) {
    // Remove the section at the specified index
    this.formAddSections.splice(index, 1);
  }
  submitReport(){
    let allModels: any[] = [];

    allModels.push(this.porcessPatientInformation());
    allModels.push(this.processSuspectedInformation());
      var a = 1;
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

    staticPatient.elements["105"] = this.viewModelFormNew.get('patientName').value; 
    staticPatient.elements["106"] = this.viewModelFormNew.get('patientPhoneNumber').value; 
    staticPatient.elements["109"] = this.viewModelFormNew.get('patientWeight').value; 
    staticPatient.elements["107"] = this.viewModelFormNew.get('patientAgeYear').value; 
    staticPatient.elements["295"] = this.viewModelFormNew.get('patientAgeMonth').value; 
    staticPatient.elements["296"] = this.viewModelFormNew.get('patientAgeDays').value; 
    staticPatient.elements["110"] = this.viewModelFormNew.get('patientGender').value;
    staticPatient.elements["111"] = this.viewModelFormNew.get('patientPregnantStatus').value; 
    staticPatient.elements["148"] = this.viewModelFormNew.get('patientDivision').value; 
    staticPatient.elements["149"] = this.viewModelFormNew.get('patientDistrict').value; 
    staticPatient.elements["150"] = this.viewModelFormNew.get('patientUpazila').value; 
    staticPatient.elements["145"] = this.viewModelFormNew.get('patientAddress').value; 

    return staticPatient;
  }

  processSuspectedInformation(){
    const staticPatient = {
      elements: {
        "112": null,
        "298": null,
        "122": null,
        "123": null,
        "124": null,
        "125": null,
        "126": null,
        "127": null,
        "128": null,
        "129": null,
        "130": null,
        "131": null,
        "156": null,
        "132": null,
        "153": null,
      },
    };
    staticPatient.elements["112"] = this.viewModelFormNew.get('suspectedType').value; 
    staticPatient.elements["298"] = this.viewModelFormNew.get('suspectedTypeSpecify').value; 
    staticPatient.elements["122"] = this.viewModelFormNew.get('suspectedLaboratoryResults').value;
    staticPatient.elements["123"] = this.viewModelFormNew.get('suspectedEventStartDate').value;
    staticPatient.elements["124"] = this.viewModelFormNew.get('suspectedEventStoppedDate').value;
    staticPatient.elements["125"] = this.viewModelFormNew.get('suspectedEventTreated').value;
    staticPatient.elements["126"] = this.viewModelFormNew.get('suspectedEventTreatedSpecify').value;
    staticPatient.elements["127"] = this.viewModelFormNew.get('suspectedAfterReaction').value;
    staticPatient.elements["128"] = this.viewModelFormNew.get('suspectedProduct').value;
    staticPatient.elements["129"] = this.viewModelFormNew.get('suspectedAppearAfter').value;
    staticPatient.elements["130"] = this.viewModelFormNew.get('suspectedAdverseEvent').value;

    staticPatient.elements["131"] = this.viewModelFormNew.get('suspectedAttributedEvent').value;
    staticPatient.elements["156"] = this.viewModelFormNew.get('suspectedDateOfDeath').value;
    staticPatient.elements["132"] = this.viewModelFormNew.get('suspectedOtherRevevant').value;
    staticPatient.elements["153"] = this.viewModelFormNew.get('suspectedOtherRevevantSpecify').value;

    return staticPatient;
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
  loadoccupation(): void{
    if(this.datasetCategories !== null){
      this.occupationList = this.datasetCategories[3].datasetElements[6].selectionDataItems;
     }
  }
  loadcompanyName(): void{
    if(this.datasetCategories !== null){
      this.companyNameList = this.datasetCategories[3].datasetElements[8].selectionDataItems;
     }
  }
  ageNotApplicableIsCheck(){
    var a= 1;
   this.ageSelectionStatus = !this.ageSelectionStatus;
   var aa = 1;
  }
}
