const Invoice = require('../models/Invoice');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// @route   GET /api/invoices
const getInvoices = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('client', 'name email companyName')
      .populate('application', 'applicationId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ invoices, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   GET /api/invoices/my
const getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ client: req.user._id })
      .populate('application', 'applicationId')
      .sort({ createdAt: -1 });
    res.json({ invoices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   GET /api/invoices/:id
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'name email phone companyName address gst pan')
      .populate('application', 'applicationId');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ invoice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   POST /api/invoices
const createInvoice = async (req, res) => {
  try {
    const { applicationId, clientId, items, gstPercent = 18, discount = 0, dueDate, notes } = req.body;

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = (subtotal * gstPercent) / 100;
    const total = subtotal + gstAmount - discount;

    const invoice = await Invoice.create({
      application: applicationId,
      client: clientId,
      items,
      subtotal,
      gstPercent,
      gstAmount,
      discount,
      total,
      dueDate,
      notes,
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('client', 'name email')
      .populate('application', 'applicationId');

    res.status(201).json({ invoice: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   PUT /api/invoices/:id
const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    }).populate('client application');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ invoice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   GET /api/invoices/:id/pdf
const generatePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'name email phone companyName address gst pan')
      .populate('application', 'applicationId');

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoiceNumber}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('HELPSHACK', 50, 50);
    doc.fontSize(10).font('Helvetica')
      .text('128/389 H-2, Block Kidwai Nagar', 50, 80)
      .text('Kanpur, 208011', 50, 95)
      .text('Email: dhirajame89@gmail.com', 50, 110)
      .text('Phone: +91 89249 54143', 50, 125);

    // Invoice details
    doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });
    doc.fontSize(10).font('Helvetica')
      .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 80, { align: 'right' })
      .text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 400, 95, { align: 'right' })
      .text(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'N/A'}`, 400, 110, { align: 'right' })
      .text(`Status: ${invoice.status.toUpperCase()}`, 400, 125, { align: 'right' });

    // Separator
    doc.moveTo(50, 155).lineTo(560, 155).stroke();

    // Bill To
    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, 170);
    doc.fontSize(10).font('Helvetica')
      .text(invoice.client?.name || 'N/A', 50, 190)
      .text(invoice.client?.companyName || '', 50, 205)
      .text(invoice.client?.email || '', 50, 220)
      .text(invoice.client?.phone || '', 50, 235);

    if (invoice.client?.gst) {
      doc.text(`GST: ${invoice.client.gst}`, 50, 250);
    }

    // Table header
    const tableTop = 290;
    doc.font('Helvetica-Bold');
    doc.text('Description', 50, tableTop);
    doc.text('Qty', 300, tableTop, { width: 50, align: 'center' });
    doc.text('Rate', 370, tableTop, { width: 80, align: 'right' });
    doc.text('Amount', 470, tableTop, { width: 80, align: 'right' });
    doc.moveTo(50, tableTop + 15).lineTo(560, tableTop + 15).stroke();

    // Table rows
    let y = tableTop + 25;
    doc.font('Helvetica');
    for (const item of invoice.items) {
      doc.text(item.description, 50, y, { width: 240 });
      doc.text(String(item.quantity), 300, y, { width: 50, align: 'center' });
      doc.text(`₹${item.rate.toLocaleString('en-IN')}`, 370, y, { width: 80, align: 'right' });
      doc.text(`₹${item.amount.toLocaleString('en-IN')}`, 470, y, { width: 80, align: 'right' });
      y += 25;
    }

    // Totals
    doc.moveTo(350, y + 10).lineTo(560, y + 10).stroke();
    y += 20;
    doc.text('Subtotal:', 370, y, { width: 80, align: 'right' });
    doc.text(`₹${invoice.subtotal.toLocaleString('en-IN')}`, 470, y, { width: 80, align: 'right' });
    y += 20;
    doc.text(`GST (${invoice.gstPercent}%):`, 370, y, { width: 80, align: 'right' });
    doc.text(`₹${invoice.gstAmount.toLocaleString('en-IN')}`, 470, y, { width: 80, align: 'right' });
    if (invoice.discount > 0) {
      y += 20;
      doc.text('Discount:', 370, y, { width: 80, align: 'right' });
      doc.text(`-₹${invoice.discount.toLocaleString('en-IN')}`, 470, y, { width: 80, align: 'right' });
    }
    y += 20;
    doc.moveTo(350, y).lineTo(560, y).stroke();
    y += 10;
    doc.font('Helvetica-Bold');
    doc.text('Total:', 370, y, { width: 80, align: 'right' });
    doc.text(`₹${invoice.total.toLocaleString('en-IN')}`, 470, y, { width: 80, align: 'right' });

    // Footer
    doc.font('Helvetica').fontSize(9)
      .text('Thank you for choosing Helpshack!', 50, 700, { align: 'center' })
      .text('This is a computer-generated invoice.', 50, 715, { align: 'center' });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getInvoices, getInvoiceById, createInvoice, updateInvoice, generatePDF, getMyInvoices };
