import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { PayrollService } from './payroll.service';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { EditLedgerEntryDto } from './dto/edit-ledger-entry.dto';
import { SetRateDto } from './dto/set-rate.dto';
import { FinalizePayrollDto } from './dto/finalize-payroll.dto';

@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('ledger')
  createLedgerEntry(@Body() dto: CreateLedgerEntryDto) {
    return this.payrollService.createLedgerEntry(dto);
  }

  @Get('ledger')
  getLedgerEntries(
    @Query('workerId') workerId?: string,
    @Query('month') month?: string,
    @Query('stage') stage?: string,
  ) {
    return this.payrollService.getLedgerEntries({ workerId, month, stage });
  }

  @Patch('ledger/:id')
  editLedgerEntry(
    @Param('id') id: string,
    @Body() dto: EditLedgerEntryDto,
  ) {
    return this.payrollService.editLedgerEntry(id, dto);
  }

  @Post('rates')
  setRate(@Body() dto: SetRateDto) {
    return this.payrollService.setRate(dto);
  }

  @Get('rates')
  getRates(@Query('month') month: string) {
    return this.payrollService.getRates(month);
  }

  @Get('calculate/:workerId')
  calculatePayroll(
    @Param('workerId') workerId: string,
    @Query('month') month: string,
  ) {
    return this.payrollService.calculatePayroll(workerId, month);
  }

  @Post('finalize')
  finalizePayroll(@Body() dto: FinalizePayrollDto) {
    return this.payrollService.finalizePayroll(dto.workerId, dto.month);
  }

  @Get('snapshots')
  getPayrollSnapshots(
    @Query('workerId') workerId?: string,
    @Query('month') month?: string,
  ) {
    return this.payrollService.getPayrollSnapshots({ workerId, month });
  }
}
